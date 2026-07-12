import multer from 'multer'
import path from 'path'
import fs from 'fs'

function diskStorage(subdir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), 'uploads', subdir)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
    },
  })
}

export const uploadSlip = multer({ storage: diskStorage('slips') })
export const uploadQr = multer({ storage: diskStorage('qr') })
