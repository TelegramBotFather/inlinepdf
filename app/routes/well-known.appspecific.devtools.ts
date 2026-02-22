export function loader() {
  return new Response('{}', {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export default function DevtoolsWellKnownRoute() {
  return null;
}
