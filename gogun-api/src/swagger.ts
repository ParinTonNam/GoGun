// OpenAPI 3.0 specification for GoGun API

const tripIdParam = {
  name: 'tripId',
  in: 'path' as const,
  required: true,
  schema: { type: 'string', format: 'uuid' },
  description: 'Trip UUID',
}

const errorResponses = {
  '400': {
    description: 'Validation error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: { error: { code: 'VALIDATION_ERROR', message: 'name is required' } },
      },
    },
  },
  '401': {
    description: 'Unauthorized — missing or invalid Bearer token',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
      },
    },
  },
  '403': {
    description: 'Forbidden — not a trip member or insufficient role',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: { error: { code: 'FORBIDDEN', message: 'Only the trip organizer can perform this action' } },
      },
    },
  },
  '404': {
    description: 'Not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: { error: { code: 'NOT_FOUND', message: 'Trip not found' } },
      },
    },
  },
}

function dataResponse(schema: object, description = 'Success') {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: { data: schema },
        },
      },
    },
  }
}

function dataArrayResponse(schema: object, description = 'Success') {
  return dataResponse({ type: 'array', items: schema }, description)
}

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GoGun (ไปกัน) API',
    version: '1.0.0',
    description: `
# GoGun — Group Trip Planning API

Backend API for the GoGun app. Replaces hardcoded frontend data with real database-backed endpoints.

## Authentication
All endpoints (except **GET /trips/join/{invite_code}** and the OTP endpoints) require a Bearer JWT token:
\`\`\`
Authorization: Bearer <token>
\`\`\`

Get a token via the OTP flow:
1. \`POST /auth/otp/send\` — receive a 6-digit code (logged to console in dev)
2. \`POST /auth/otp/verify\` — exchange code for a JWT (valid 90 days)

## Response Shape
**Success:** \`{ "data": <payload>, "meta"?: { "total": N } }\`

**Error:** \`{ "error": { "code": "...", "message": "..." } }\`

## Seed Data (dev)
- Trip: **ทริปญี่ปุ่น Autumn** — invite code \`tokyo-kyoto-x4\`
- Users (login via phone):
  - ต้นน้ำ (organizer) → \`0911111111\`
  - เจมส์ → \`0922222222\`
  - นาย → \`0933333333\`
  - อาตีฟ → \`0944444444\`
    `,
  },
  servers: [
    { url: 'http://localhost:3001/api/v1', description: 'Local development' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT obtained from POST /auth/otp/verify',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Trip not found' },
            },
          },
        },
      },
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '11111111-1111-1111-1111-111111111111' },
          display_name: { type: 'string', example: 'ต้นน้ำ' },
          avatar_color: { type: 'string', example: '#c0613e' },
        },
      },
      User: {
        allOf: [
          { $ref: '#/components/schemas/UserPublic' },
          {
            type: 'object',
            properties: {
              phone: { type: 'string', nullable: true, example: '0911111***' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      Trip: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'ทริปญี่ปุ่น Autumn' },
          destination: { type: 'string', example: 'Japan' },
          duration_days: { type: 'integer', example: 5 },
          proposed_start_date: { type: 'string', format: 'date', nullable: true, example: '2026-11-12' },
          confirmed_start_date: { type: 'string', format: 'date', nullable: true, example: '2026-11-12' },
          date_status: { type: 'string', enum: ['proposed', 'confirmed'], example: 'confirmed' },
          currency: { type: 'string', example: 'JPY' },
          invite_code: { type: 'string', example: 'tokyo-kyoto-x4' },
          organizer_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      TripWithMembers: {
        allOf: [
          { $ref: '#/components/schemas/Trip' },
          {
            type: 'object',
            properties: {
              organizer: { $ref: '#/components/schemas/UserPublic' },
              members: {
                type: 'array',
                items: { $ref: '#/components/schemas/TripMember' },
              },
            },
          },
        ],
      },
      TripMember: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['organizer', 'member'] },
          status: { type: 'string', enum: ['invited', 'joined', 'declined'] },
          joined_at: { type: 'string', format: 'date-time', nullable: true },
          user: { $ref: '#/components/schemas/UserPublic' },
        },
      },
      ItineraryActivity: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          day_id: { type: 'string', format: 'uuid' },
          time: { type: 'string', example: '06:30' },
          title: { type: 'string', example: 'เช็คอินสนามบิน' },
          sort_order: { type: 'integer', example: 0 },
        },
      },
      ItineraryDay: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          day_number: { type: 'integer', example: 1 },
          date: { type: 'string', format: 'date', example: '2026-11-12' },
          label: { type: 'string', example: 'ลงเครื่อง · Tokyo' },
          activities: { type: 'array', items: { $ref: '#/components/schemas/ItineraryActivity' } },
        },
      },
      ExpenseSplit: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          expense_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', example: 36800 },
          user: { $ref: '#/components/schemas/UserPublic' },
        },
      },
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'ตั๋วเครื่องบิน × 4' },
          category: {
            type: 'string',
            enum: ['plane', 'hotel', 'food', 'train', 'wifi', 'ticket', 'other'],
            example: 'plane',
          },
          total_amount: { type: 'number', example: 147200 },
          currency: { type: 'string', example: 'JPY' },
          paid_by_user_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          paid_by: { $ref: '#/components/schemas/UserPublic' },
          splits: { type: 'array', items: { $ref: '#/components/schemas/ExpenseSplit' } },
        },
      },
      MemberBalance: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          display_name: { type: 'string', example: 'ต้นน้ำ' },
          avatar_color: { type: 'string', example: '#c0613e' },
          paid: { type: 'number', description: 'Total amount paid', example: 229200 },
          share: { type: 'number', description: 'Fair share owed', example: 73150 },
          net: { type: 'number', description: 'positive = owed money, negative = owes money', example: 156050 },
        },
      },
      Balance: {
        type: 'object',
        properties: {
          total_amount: { type: 'number', example: 290800 },
          currency: { type: 'string', example: 'JPY' },
          member_count: { type: 'integer', example: 4 },
          balances: { type: 'array', items: { $ref: '#/components/schemas/MemberBalance' } },
        },
      },
      Settlement: {
        type: 'object',
        properties: {
          from_user_id: { type: 'string', format: 'uuid' },
          to_user_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', example: 72250 },
          currency: { type: 'string', example: 'JPY' },
          from_user: { $ref: '#/components/schemas/UserPublic' },
          to_user: { $ref: '#/components/schemas/UserPublic' },
        },
      },
      TransferSlip: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          from_user_id: { type: 'string', format: 'uuid' },
          to_user_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', example: 72250 },
          currency: { type: 'string', example: 'JPY' },
          status: { type: 'string', enum: ['pending', 'slip_attached', 'confirmed'] },
          slip_url: { type: 'string', nullable: true, example: '/uploads/slips/1234.jpg' },
          confirmed_at: { type: 'string', format: 'date-time', nullable: true },
          from_user: { $ref: '#/components/schemas/UserPublic' },
          to_user: { $ref: '#/components/schemas/UserPublic' },
        },
      },
      PaymentMethod: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['qr', 'promptpay'] },
          qr_image_url: { type: 'string', nullable: true, example: '/uploads/qr/abc.png' },
          promptpay_number: { type: 'string', nullable: true, example: '092424-5***' },
        },
      },
      AvailabilityDay: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date', example: '2026-11-12' },
          available: { type: 'integer', example: 3 },
          uncertain: { type: 'integer', example: 1 },
          member_count: { type: 'integer', example: 4 },
          variant: { type: 'string', enum: ['all', 'some', 'uncertain', 'default'] },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user_id: { type: 'string', format: 'uuid' },
                display_name: { type: 'string' },
                avatar_color: { type: 'string' },
                status: { type: 'string', enum: ['available', 'uncertain', 'unavailable'] },
              },
            },
          },
        },
      },
      UserAvailability: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          date: { type: 'string', format: 'date', example: '2026-11-12' },
          status: { type: 'string', enum: ['available', 'uncertain', 'unavailable'] },
        },
      },
      PollOption: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          poll_id: { type: 'string', format: 'uuid' },
          text: { type: 'string', example: 'Kikunoi (มิชลิน 3 ดาว, ¥38k)' },
          sort_order: { type: 'integer', example: 0 },
          vote_count: { type: 'integer', example: 2 },
          voters: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserPublic' },
          },
          is_winner: { type: 'boolean', description: 'Only present when poll.status = closed' },
        },
      },
      Poll: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'วันที่ 4 — เลือกที่กิน Kaiseki' },
          subtitle: { type: 'string', nullable: true, example: 'ปิดโหวต 25 Oct · 4 คนต้องโหวต' },
          close_date: { type: 'string', format: 'date', nullable: true, example: '2026-10-25' },
          status: { type: 'string', enum: ['open', 'closed'] },
          created_by_user_id: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          options: { type: 'array', items: { $ref: '#/components/schemas/PollOption' } },
        },
      },
      PollDetail: {
        type: 'object',
        properties: {
          poll: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              subtitle: { type: 'string', nullable: true },
              status: { type: 'string', enum: ['open', 'closed'] },
              close_date: { type: 'string', format: 'date', nullable: true },
            },
          },
          total_voters: { type: 'integer', example: 2 },
          options: { type: 'array', items: { $ref: '#/components/schemas/PollOption' } },
          my_vote_option_id: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      PackingItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          text: { type: 'string', example: 'Pocket WiFi' },
          category: { type: 'string', enum: ['shared', 'personal'] },
          sort_order: { type: 'integer', example: 0 },
          assignees: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
          checked_by: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
          is_checked: { type: 'boolean', description: 'Whether the current user has checked this item' },
        },
      },
      ChecklistItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          text: { type: 'string', example: 'ทำวีซ่า Japan / เช็คพาสปอร์ต' },
          sort_order: { type: 'integer', example: 0 },
          checked_by: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                display_name: { type: 'string' },
                avatar_color: { type: 'string' },
                checked_at: { type: 'string', format: 'date-time' },
              },
            },
          },
          is_checked: { type: 'boolean', description: 'Whether the current user has checked this item' },
        },
      },
      WheelOption: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          text: { type: 'string', example: 'Sushi Dai' },
          color: { type: 'string', example: '#c0613e' },
          sort_order: { type: 'integer', example: 0 },
        },
      },
      TripNote: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trip_id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['hotel', 'plane', 'location', 'link'], example: 'hotel' },
          title: { type: 'string', example: 'Shinjuku Granbell Hotel' },
          subtitle: { type: 'string', nullable: true, example: '2 คืน · check-in 12 Nov' },
          url: { type: 'string', nullable: true, example: 'https://example.com' },
          sort_order: { type: 'integer', example: 0 },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Phone OTP authentication' },
    { name: 'Trips', description: 'Trip creation and management' },
    { name: 'Members', description: 'Trip membership management' },
    { name: 'Itinerary', description: 'Day-by-day itinerary and activities' },
    { name: 'Expenses', description: 'Expenses, balance calculation, and debt-minimization settlements' },
    { name: 'Transfers', description: 'Payment slip uploads and organizer confirmations' },
    { name: 'Payment Methods', description: 'QR code and PromptPay number per trip' },
    { name: 'Availability', description: 'Member date availability for trip planning' },
    { name: 'Polls', description: 'Group voting polls (single choice per person)' },
    { name: 'Packing', description: 'Shared and personal packing list with assignees' },
    { name: 'Checklist', description: 'Pre-trip per-person task checklist' },
    { name: 'Wheel', description: 'Random spin wheel options' },
    { name: 'Notes', description: 'Trip notes — hotels, flights, locations, links' },
  ],
  paths: {
    // ─── AUTH ───────────────────────────────────────────────────────────────────
    '/auth/otp/send': {
      post: {
        tags: ['Auth'],
        summary: 'Send OTP to phone number',
        description: 'Sends a 6-digit OTP via SMS (logged to console in development).',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone'],
                properties: { phone: { type: 'string', example: '0911111111' } },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ type: 'object', properties: { message: { type: 'string', example: 'OTP sent' } } }),
          '400': errorResponses['400'],
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify OTP and get JWT token',
        description: 'Verifies the OTP. Creates a new user account if the phone number is new. Returns a JWT valid for 90 days.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'code'],
                properties: {
                  phone: { type: 'string', example: '0911111111' },
                  code: { type: 'string', example: '460183' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({
            type: 'object',
            properties: {
              token: { type: 'string', description: 'JWT Bearer token (90 days)', example: 'eyJhbGci...' },
              user: { $ref: '#/components/schemas/User' },
            },
          }),
          '400': errorResponses['400'],
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/User' }),
          '401': errorResponses['401'],
        },
      },
    },

    // ─── TRIPS ──────────────────────────────────────────────────────────────────
    '/trips': {
      post: {
        tags: ['Trips'],
        summary: 'Create a new trip',
        description: 'Creates a trip and adds the authenticated user as the organizer.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'destination', 'duration_days'],
                properties: {
                  name: { type: 'string', example: 'ทริปญี่ปุ่น Autumn' },
                  destination: { type: 'string', example: 'Japan' },
                  duration_days: { type: 'integer', example: 5 },
                  proposed_start_date: { type: 'string', format: 'date', example: '2026-11-12' },
                  currency: { type: 'string', example: 'JPY' },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/TripWithMembers' }, 'Trip created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
        },
      },
    },
    '/trips/join/{invite_code}': {
      get: {
        tags: ['Trips'],
        summary: 'Get trip info by invite code (public)',
        description: 'Returns trip details and current members. No authentication required — used on the join preview page.',
        security: [],
        parameters: [
          {
            name: 'invite_code',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'tokyo-kyoto-x4' },
          },
        ],
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/TripWithMembers' }),
          '404': errorResponses['404'],
        },
      },
    },
    '/trips/{tripId}': {
      get: {
        tags: ['Trips'],
        summary: 'Get trip detail',
        parameters: [tripIdParam],
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/TripWithMembers' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      patch: {
        tags: ['Trips'],
        summary: 'Update trip (organizer only)',
        parameters: [tripIdParam],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  destination: { type: 'string' },
                  duration_days: { type: 'integer' },
                  proposed_start_date: { type: 'string', format: 'date', nullable: true },
                  confirmed_start_date: { type: 'string', format: 'date', nullable: true },
                  date_status: { type: 'string', enum: ['proposed', 'confirmed'] },
                  currency: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/Trip' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── MEMBERS ────────────────────────────────────────────────────────────────
    '/trips/{tripId}/members': {
      get: {
        tags: ['Members'],
        summary: 'List all members of the trip',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/TripMember' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      post: {
        tags: ['Members'],
        summary: 'Join the trip',
        description: 'Authenticated user joins the trip. Optionally sets display_name and avatar_color on first join.',
        parameters: [tripIdParam],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  display_name: { type: 'string', example: 'เจมส์' },
                  avatar_color: { type: 'string', example: '#4f6e7a' },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/TripMember' }, 'Joined'),
          '401': errorResponses['401'],
          '409': { description: 'Already a member' },
        },
      },
    },
    '/trips/{tripId}/members/{userId}': {
      patch: {
        tags: ['Members'],
        summary: 'Update member role or status (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['organizer', 'member'] },
                  status: { type: 'string', enum: ['invited', 'joined', 'declined'] },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/TripMember' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Members'],
        summary: 'Remove member from trip (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean', example: true } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── ITINERARY ──────────────────────────────────────────────────────────────
    '/trips/{tripId}/itinerary': {
      get: {
        tags: ['Itinerary'],
        summary: 'List all itinerary days with activities',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/ItineraryDay' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/itinerary/days': {
      post: {
        tags: ['Itinerary'],
        summary: 'Add a new itinerary day (organizer only)',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['day_number', 'date', 'label'],
                properties: {
                  day_number: { type: 'integer', example: 1 },
                  date: { type: 'string', format: 'date', example: '2026-11-12' },
                  label: { type: 'string', example: 'ลงเครื่อง · Tokyo' },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/ItineraryDay' }, 'Day created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/itinerary/days/{dayId}': {
      patch: {
        tags: ['Itinerary'],
        summary: 'Update a day label or date (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'dayId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/ItineraryDay' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },
    '/trips/{tripId}/itinerary/days/{dayId}/activities': {
      post: {
        tags: ['Itinerary'],
        summary: 'Add an activity to a day (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'dayId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['time', 'title'],
                properties: {
                  time: { type: 'string', example: '06:30' },
                  title: { type: 'string', example: 'เช็คอินสนามบิน' },
                  sort_order: { type: 'integer', example: 0 },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/ItineraryActivity' }, 'Activity created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/itinerary/activities/{actId}': {
      patch: {
        tags: ['Itinerary'],
        summary: 'Edit an activity (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'actId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  time: { type: 'string' },
                  title: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/ItineraryActivity' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Itinerary'],
        summary: 'Delete an activity (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'actId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },
    '/trips/{tripId}/itinerary/activities/{actId}/reorder': {
      patch: {
        tags: ['Itinerary'],
        summary: 'Update activity sort order (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'actId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sort_order'],
                properties: { sort_order: { type: 'integer', example: 2 } },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/ItineraryActivity' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── EXPENSES ───────────────────────────────────────────────────────────────
    '/trips/{tripId}/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'List all expenses for the trip',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/Expense' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Add a new expense',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'category', 'total_amount', 'currency', 'paid_by_user_id', 'splits'],
                properties: {
                  name: { type: 'string', example: 'ตั๋วเครื่องบิน × 4' },
                  category: { type: 'string', enum: ['plane', 'hotel', 'food', 'train', 'wifi', 'ticket', 'other'] },
                  total_amount: { type: 'number', example: 147200 },
                  currency: { type: 'string', example: 'JPY' },
                  paid_by_user_id: { type: 'string', format: 'uuid' },
                  splits: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['user_id', 'amount'],
                      properties: {
                        user_id: { type: 'string', format: 'uuid' },
                        amount: { type: 'number', example: 36800 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/Expense' }, 'Expense created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/expenses/balance': {
      get: {
        tags: ['Expenses'],
        summary: 'Get member balance summary',
        description: 'Returns each member\'s total paid, fair share, and net balance (positive = owed money back).',
        parameters: [tripIdParam],
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/Balance' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/expenses/settlements': {
      get: {
        tags: ['Expenses'],
        summary: 'Get optimized settlement transfers',
        description: 'Runs the debt-minimization algorithm to find the minimum number of transfers needed to settle all balances.',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/Settlement' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/expenses/{expId}': {
      patch: {
        tags: ['Expenses'],
        summary: 'Edit an expense',
        parameters: [
          tripIdParam,
          { name: 'expId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                  total_amount: { type: 'number' },
                  currency: { type: 'string' },
                  paid_by_user_id: { type: 'string', format: 'uuid' },
                  splits: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        user_id: { type: 'string', format: 'uuid' },
                        amount: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/Expense' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Delete an expense',
        parameters: [
          tripIdParam,
          { name: 'expId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── TRANSFERS ──────────────────────────────────────────────────────────────
    '/trips/{tripId}/transfers': {
      get: {
        tags: ['Transfers'],
        summary: 'List transfer slip statuses',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/TransferSlip' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/transfers/{transferId}/slip': {
      post: {
        tags: ['Transfers'],
        summary: 'Upload payment slip image (sender only)',
        description: 'The authenticated user must be the `from_user` of the transfer. Accepts multipart/form-data with a `slip` file.',
        parameters: [
          tripIdParam,
          { name: 'transferId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['slip'],
                properties: {
                  slip: { type: 'string', format: 'binary', description: 'Slip image file (jpg/png)' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/TransferSlip' }),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },
    '/trips/{tripId}/transfers/{transferId}/confirm': {
      patch: {
        tags: ['Transfers'],
        summary: 'Confirm receipt of payment (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'transferId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/TransferSlip' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── PAYMENT METHODS ────────────────────────────────────────────────────────
    '/trips/{tripId}/payment-methods/{userId}': {
      get: {
        tags: ['Payment Methods'],
        summary: "Get a user's payment methods for this trip",
        description: 'Returns QR code URL and/or PromptPay number (last 3 digits masked).',
        parameters: [
          tripIdParam,
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/PaymentMethod' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/payment-methods': {
      put: {
        tags: ['Payment Methods'],
        summary: 'Upsert payment method for current user',
        description: `
Upload QR image or set PromptPay number for the current user in this trip.

- For **PromptPay**: send \`multipart/form-data\` with \`type=promptpay\` and \`promptpay_number\`.
- For **QR image**: send \`multipart/form-data\` with \`type=qr\` and a \`qr_image\` file.
        `,
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['qr', 'promptpay'] },
                  promptpay_number: { type: 'string', example: '0924245678', description: 'Required when type=promptpay' },
                  qr_image: { type: 'string', format: 'binary', description: 'Required when type=qr' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/PaymentMethod' }),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },

    // ─── AVAILABILITY ───────────────────────────────────────────────────────────
    '/trips/{tripId}/availability': {
      get: {
        tags: ['Availability'],
        summary: 'Get all members\' availability (organizer view)',
        description: 'Returns one entry per date in the trip range with variant (all/some/uncertain/default) and member breakdown.',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/AvailabilityDay' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      put: {
        tags: ['Availability'],
        summary: 'Upsert current user\'s availability for multiple dates',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['date', 'status'],
                  properties: {
                    date: { type: 'string', format: 'date', example: '2026-11-12' },
                    status: { type: 'string', enum: ['available', 'uncertain', 'unavailable'] },
                  },
                },
              },
              example: [
                { date: '2026-11-12', status: 'available' },
                { date: '2026-11-13', status: 'uncertain' },
                { date: '2026-11-14', status: 'unavailable' },
              ],
            },
          },
        },
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/UserAvailability' }),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/availability/me': {
      get: {
        tags: ['Availability'],
        summary: 'Get current user\'s availability',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/UserAvailability' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },

    // ─── POLLS ──────────────────────────────────────────────────────────────────
    '/trips/{tripId}/polls': {
      get: {
        tags: ['Polls'],
        summary: 'List all polls with vote counts',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/Poll' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      post: {
        tags: ['Polls'],
        summary: 'Create a poll (organizer only)',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'วันที่ 4 — เลือกที่กิน Kaiseki' },
                  subtitle: { type: 'string', example: 'ปิดโหวต 25 Oct · 4 คนต้องโหวต' },
                  close_date: { type: 'string', format: 'date', example: '2026-10-25' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['text'],
                      properties: {
                        text: { type: 'string', example: 'Kikunoi (มิชลิน 3 ดาว, ¥38k)' },
                        sort_order: { type: 'integer', example: 0 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/Poll' }, 'Poll created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/polls/{pollId}': {
      get: {
        tags: ['Polls'],
        summary: 'Get poll detail with vote breakdown',
        description: 'Returns options with vote counts, voter list, and the current user\'s vote. `is_winner` is set on options when poll is closed.',
        parameters: [
          tripIdParam,
          { name: 'pollId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/PollDetail' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      patch: {
        tags: ['Polls'],
        summary: 'Update poll title or status (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'pollId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  subtitle: { type: 'string' },
                  status: { type: 'string', enum: ['open', 'closed'] },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/Poll' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Polls'],
        summary: 'Delete a poll (organizer only)',
        parameters: [
          tripIdParam,
          { name: 'pollId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },
    '/trips/{tripId}/polls/{pollId}/vote': {
      post: {
        tags: ['Polls'],
        summary: 'Cast or change vote',
        description: 'One vote per person per poll. Calling again changes the existing vote (upsert).',
        parameters: [
          tripIdParam,
          { name: 'pollId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['option_id'],
                properties: {
                  option_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              poll_id: { type: 'string', format: 'uuid' },
              option_id: { type: 'string', format: 'uuid' },
              user_id: { type: 'string', format: 'uuid' },
              voted_at: { type: 'string', format: 'date-time' },
            },
          }),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
          '409': { description: 'Poll is closed' },
        },
      },
      delete: {
        tags: ['Polls'],
        summary: 'Remove vote',
        parameters: [
          tripIdParam,
          { name: 'pollId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── PACKING ────────────────────────────────────────────────────────────────
    '/trips/{tripId}/packing': {
      get: {
        tags: ['Packing'],
        summary: 'List all packing items with check state for current user',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/PackingItem' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      post: {
        tags: ['Packing'],
        summary: 'Add a packing item',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'category'],
                properties: {
                  text: { type: 'string', example: 'Pocket WiFi' },
                  category: { type: 'string', enum: ['shared', 'personal'] },
                  assignees: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'User IDs responsible for bringing this item (shared items)',
                  },
                  sort_order: { type: 'integer', example: 0 },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/PackingItem' }, 'Item created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/packing/{itemId}': {
      patch: {
        tags: ['Packing'],
        summary: 'Edit packing item text or category',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  category: { type: 'string', enum: ['shared', 'personal'] },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/PackingItem' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Packing'],
        summary: 'Delete a packing item',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },
    '/trips/{tripId}/packing/{itemId}/check': {
      post: {
        tags: ['Packing'],
        summary: 'Mark packing item as checked (current user)',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { checked: { type: 'boolean', example: true } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Packing'],
        summary: 'Uncheck packing item (current user)',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── CHECKLIST ──────────────────────────────────────────────────────────────
    '/trips/{tripId}/checklist': {
      get: {
        tags: ['Checklist'],
        summary: 'List all checklist items with per-member check state',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/ChecklistItem' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      post: {
        tags: ['Checklist'],
        summary: 'Add a checklist item',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', example: 'ทำวีซ่า Japan / เช็คพาสปอร์ต' },
                  sort_order: { type: 'integer', example: 0 },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/ChecklistItem' }, 'Item created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/checklist/{itemId}': {
      patch: {
        tags: ['Checklist'],
        summary: 'Edit checklist item',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/ChecklistItem' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Checklist'],
        summary: 'Delete checklist item',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },
    '/trips/{tripId}/checklist/{itemId}/check': {
      post: {
        tags: ['Checklist'],
        summary: 'Mark checklist item as checked (current user)',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { checked: { type: 'boolean', example: true } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Checklist'],
        summary: 'Uncheck checklist item (current user)',
        parameters: [
          tripIdParam,
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── WHEEL ──────────────────────────────────────────────────────────────────
    '/trips/{tripId}/wheel': {
      get: {
        tags: ['Wheel'],
        summary: 'List all wheel options',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/WheelOption' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      post: {
        tags: ['Wheel'],
        summary: 'Add a wheel option',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'color'],
                properties: {
                  text: { type: 'string', example: 'Sushi Dai' },
                  color: { type: 'string', example: '#c0613e' },
                  sort_order: { type: 'integer', example: 0 },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/WheelOption' }, 'Option created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/wheel/{optId}': {
      delete: {
        tags: ['Wheel'],
        summary: 'Remove a wheel option',
        parameters: [
          tripIdParam,
          { name: 'optId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },

    // ─── NOTES ──────────────────────────────────────────────────────────────────
    '/trips/{tripId}/notes': {
      get: {
        tags: ['Notes'],
        summary: 'List all trip notes',
        parameters: [tripIdParam],
        responses: {
          '200': dataArrayResponse({ $ref: '#/components/schemas/TripNote' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
      post: {
        tags: ['Notes'],
        summary: 'Add a note',
        parameters: [tripIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'title'],
                properties: {
                  type: { type: 'string', enum: ['hotel', 'plane', 'location', 'link'], example: 'hotel' },
                  title: { type: 'string', example: 'Shinjuku Granbell Hotel' },
                  subtitle: { type: 'string', example: '2 คืน · check-in 12 Nov' },
                  url: { type: 'string', example: 'https://booking.com/...' },
                  sort_order: { type: 'integer', example: 0 },
                },
              },
            },
          },
        },
        responses: {
          '201': dataResponse({ $ref: '#/components/schemas/TripNote' }, 'Note created'),
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/trips/{tripId}/notes/{noteId}': {
      patch: {
        tags: ['Notes'],
        summary: 'Edit a note',
        parameters: [
          tripIdParam,
          { name: 'noteId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['hotel', 'plane', 'location', 'link'] },
                  title: { type: 'string' },
                  subtitle: { type: 'string' },
                  url: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': dataResponse({ $ref: '#/components/schemas/TripNote' }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Notes'],
        summary: 'Delete a note',
        parameters: [
          tripIdParam,
          { name: 'noteId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': dataResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
    },
  },
}

export default swaggerSpec
