import { supabase } from '@/lib/supabase/client'

export async function uploadImage(file: File): Promise<string> {
  try {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('media')
      .upload(fileName, file, { contentType: file.type, upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('media').getPublicUrl(fileName)
    return data.publicUrl
  } catch {
    return fileToBase64(file)
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}
