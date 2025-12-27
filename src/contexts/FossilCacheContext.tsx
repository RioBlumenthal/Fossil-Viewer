'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Fossil {
  id: string
  user_id: string
  species: string | null
  description: string
  location: string | null
  discovery_date: string | null
  tags: string[] | null
  image_url: string
  created_at: string
  updated_at: string
}

interface SearchFilters {
  searchQuery?: string
  species?: string
  location?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
}

interface FossilCacheContextType {
  allFossils: Fossil[]
  userFossils: Fossil[]
  allFossilsCount: number
  loadingAll: boolean
  loadingUser: boolean
  errorAll: string
  errorUser: string
  fetchAllFossils: (page: number, pageSize: number, filters?: SearchFilters) => Promise<{ fossils: Fossil[]; totalCount: number }>
  fetchUserFossils: (filters?: SearchFilters) => Promise<void>
  clearCache: () => void
}

const FossilCacheContext = createContext<FossilCacheContextType | undefined>(undefined)

export function FossilCacheProvider({ children }: { children: ReactNode }) {
  const [allFossils, setAllFossils] = useState<Fossil[]>([])
  const [userFossils, setUserFossils] = useState<Fossil[]>([])
  const [allFossilsCount, setAllFossilsCount] = useState(0)
  const [loadingAll, setLoadingAll] = useState(false)
  const [loadingUser, setLoadingUser] = useState(false)
  const [errorAll, setErrorAll] = useState('')
  const [errorUser, setErrorUser] = useState('')

  // Cache for paginated results (key includes filters)
  const [allFossilsCache, setAllFossilsCache] = useState<Map<string, { fossils: Fossil[]; totalCount: number }>>(new Map())
  const [userFossilsCached, setUserFossilsCached] = useState(false)
  const [userFossilsFilters, setUserFossilsFilters] = useState<SearchFilters | undefined>(undefined)

  const buildCacheKey = (page: number, filters?: SearchFilters) => {
    if (!filters) return `page-${page}`
    return `page-${page}-${JSON.stringify(filters)}`
  }

  const removeSearchQuery = (filters?: SearchFilters): SearchFilters | undefined => {
    if (!filters?.searchQuery) return filters
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { searchQuery, ...rest } = filters
    return rest
  }

  const getErrorMessage = (err: unknown, defaultMsg: string = 'Failed to load fossils'): string => {
    return err instanceof Error ? err.message : defaultMsg
  }

  type SupabaseQuery = ReturnType<ReturnType<ReturnType<typeof createClient>['from']>['select']>
  
  const applyFilters = useCallback((
    query: SupabaseQuery,
    filters?: SearchFilters
  ): SupabaseQuery => {
    if (!filters) return query

    // Species filter
    if (filters.species) {
      query = query.ilike('species', `%${filters.species}%`)
    }

    // Location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    // Date range filter
    if (filters.dateFrom) {
      query = query.gte('discovery_date', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('discovery_date', filters.dateTo)
    }

    return query
  }, [])

  const filterFossils = (fossils: Fossil[], filters?: SearchFilters): Fossil[] => {
    if (!filters || !filters.searchQuery) return fossils

    const searchTerm = filters.searchQuery.toLowerCase().trim()
    if (!searchTerm) return fossils

    return fossils.filter((fossil) => {
      const matchesSpecies = fossil.species?.toLowerCase().includes(searchTerm) || false
      const matchesLocation = fossil.location?.toLowerCase().includes(searchTerm) || false
      const matchesDescription = fossil.description?.toLowerCase().includes(searchTerm) || false
      const matchesTags = fossil.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) || false

      return matchesSpecies || matchesLocation || matchesDescription || matchesTags
    })
  }

  const fetchAllFossils = useCallback(async (page: number, pageSize: number, filters?: SearchFilters) => {
    const cacheKey = buildCacheKey(page, filters)
    
    // Check cache first (only if no filters or search)
    if (!filters || (!filters.searchQuery && !filters.species && !filters.location && !filters.tags?.length && !filters.dateFrom && !filters.dateTo)) {
      const cached = allFossilsCache.get(cacheKey)
      if (cached) {
        setAllFossils(cached.fossils)
        setAllFossilsCount(cached.totalCount)
        return cached
      }
    }

    try {
      setLoadingAll(true)
      setErrorAll('')
      const supabase = createClient()

      // Build query with filters
      let countQuery = supabase.from('fossils').select('*', { count: 'exact', head: true })
      let dataQuery = supabase.from('fossils').select('*')

      // Apply filters (excluding search query which is handled client-side)
      const filtersWithoutSearch = removeSearchQuery(filters)
      countQuery = applyFilters(countQuery, filtersWithoutSearch)
      dataQuery = applyFilters(dataQuery, filtersWithoutSearch)

      // Fetch total count
      const { count } = await countQuery
      const totalCount = count || 0

      // Calculate range for pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Fetch fossils for this page
      const { data, error: fetchError } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      let fossils = data || []

      // Apply client-side search if needed (for description and complex searches)
      if (filters?.searchQuery) {
        // Get all matching fossils (without pagination) to filter by search
        const allDataQuery = applyFilters(supabase.from('fossils').select('*'), removeSearchQuery(filters))
        const { data: allFossilsData } = await allDataQuery.order('created_at', { ascending: false })
        const filteredAll = filterFossils((allFossilsData || []) as Fossil[], filters)
        setAllFossilsCount(filteredAll.length)
        
        // Filter the current page results
        fossils = filterFossils(fossils, filters)
        // Re-paginate after filtering
        const filteredFrom = (page - 1) * pageSize
        const filteredTo = filteredFrom + pageSize
        fossils = filteredAll.slice(filteredFrom, filteredTo)
      } else {
        setAllFossilsCount(totalCount)
      }

      setAllFossils(fossils)

      // Cache the result (only if no search query, as search results can vary)
      if (!filters?.searchQuery) {
        setAllFossilsCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(cacheKey, { fossils, totalCount: filters?.searchQuery ? fossils.length : totalCount })
          return newCache
        })
      }

      return { fossils, totalCount: filters?.searchQuery ? fossils.length : totalCount }
    } catch (err) {
      setErrorAll(getErrorMessage(err))
      throw err
    } finally {
      setLoadingAll(false)
    }
  }, [allFossilsCache, applyFilters])

  const fetchUserFossils = useCallback(async (filters?: SearchFilters) => {
    // Check cache first (only if filters match or no filters)
    const filtersMatch = JSON.stringify(filters) === JSON.stringify(userFossilsFilters)
    if (userFossilsCached && filtersMatch) {
      return
    }

    try {
      setLoadingUser(true)
      setErrorUser('')
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErrorUser('You must be logged in to view your fossils')
        setLoadingUser(false)
        return
      }

      // Build query
      let query = supabase
        .from('fossils')
        .select('*')
        .eq('user_id', user.id)

      // Apply filters (excluding search query which is handled client-side)
      query = applyFilters(query, removeSearchQuery(filters))

      // Fetch fossils for this user
      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      let fossils = data || []

      // Apply client-side search if needed
      if (filters?.searchQuery) {
        fossils = filterFossils(fossils, filters)
      }

      setUserFossils(fossils)
      setUserFossilsCached(true)
      setUserFossilsFilters(filters)
    } catch (err) {
      setErrorUser(getErrorMessage(err))
    } finally {
      setLoadingUser(false)
    }
  }, [userFossilsCached, userFossilsFilters, applyFilters])

  const clearCache = useCallback(() => {
    setAllFossils([])
    setUserFossils([])
    setAllFossilsCache(new Map())
    setUserFossilsCached(false)
    setErrorAll('')
    setErrorUser('')
  }, [])

  return (
    <FossilCacheContext.Provider
      value={{
        allFossils,
        userFossils,
        allFossilsCount,
        loadingAll,
        loadingUser,
        errorAll,
        errorUser,
        fetchAllFossils,
        fetchUserFossils,
        clearCache,
      }}
    >
      {children}
    </FossilCacheContext.Provider>
  )
}

export function useFossilCache() {
  const context = useContext(FossilCacheContext)
  if (context === undefined) {
    throw new Error('useFossilCache must be used within a FossilCacheProvider')
  }
  return context
}

