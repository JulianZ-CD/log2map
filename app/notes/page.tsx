import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('restaurants').select()

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}