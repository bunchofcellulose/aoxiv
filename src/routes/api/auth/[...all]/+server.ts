import type { RequestHandler } from './$types';

const handler: RequestHandler = async (event) => {
	if (!event.locals.auth) {
		return new Response('Authentication is not configured', { status: 503 });
	}
	return event.locals.auth.handler(event.request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
