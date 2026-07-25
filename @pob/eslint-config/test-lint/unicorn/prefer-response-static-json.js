const data = { message: "Hello, world!" };

// eslint-disable-next-line unicorn/prefer-response-static-json
export const response1 = new Response(JSON.stringify(data));

// ✅
export const response2 = Response.json(data);
