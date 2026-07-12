declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        email: string
        display_name: string
        avatar_color: string
        phone: string | null
        is_guest: boolean
        created_at: Date
      }
      tripMember?: {
        id: string
        trip_id: string
        user_id: string
        role: string
        status: string
        joined_at: Date | null
      }
    }
  }
}

export {}
