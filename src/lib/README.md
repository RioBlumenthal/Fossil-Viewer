# Supabase Setup

## Environment Variables

Create a `.env.local` file in the root of your project with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project settings: https://app.supabase.com/project/_/settings/api

## Usage

### Client Components (Browser)

```typescript
import { supabase } from '@/lib/supabase'

// Example: Fetch data
const { data, error } = await supabase
  .from('your_table')
  .select('*')
```

### Server Components

```typescript
import { createServerClient } from '@/lib/supabase-server'

export default async function Page() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
  
  return <div>{/* render data */}</div>
}
```

### API Routes

```typescript
import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
  
  return NextResponse.json({ data, error })
}
```

