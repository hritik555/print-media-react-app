import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const { user } = JSON.parse(event.body || '{}')

  // Assign default role based on email domain or leave as 'partner'
  // Admin accounts must be set via Netlify UI.
  const roles = user?.app_metadata?.roles ?? ['partner']

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        ...user?.app_metadata,
        roles,
      },
    }),
  }
}

export { handler }
