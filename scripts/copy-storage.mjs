import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const src = 'storage/flowers'
const dest = 'public/storage/flowers'

if (!existsSync(src)) {
  console.log('copy-storage: папка storage/flowers не найдена, пропуск')
  process.exit(0)
}

mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log(`copy-storage: скопировано ${src} → ${dest}`)
