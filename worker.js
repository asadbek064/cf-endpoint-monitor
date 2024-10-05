const ENDPOINT = 'https://git.sheetjs.com/SheetJS/sheetjs';
const MAX_LOAD_TIME = 5000;

// discord webhook
const NOTIFY_URL = '';

function timeoutPromise(ms, error) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(error)), ms)
  );
}


async function fetchWithTimeout(url, options, timeout) {
  return Promise.race([
    fetch(url, options),
    timeoutPromise(timeout, `Request timed out after ${timeout}ms`)
  ]);
}

async function checkEndpoint() {
  const start = Date.now();
  
  try {
    const response = await fetchWithTimeout(ENDPOINT, { method: 'GET' }, MAX_LOAD_TIME);
    const duration = Date.now() - start;

    if (duration > MAX_LOAD_TIME || !response.ok) {
      await notifyFailure(duration);

      return createResponse(`Failed | Duration: ${duration}ms`, 500);
    }

    return createResponse(`Passed | Duration: ${duration}ms`, 200);

  } catch (error) {
    console.log(`Error fetching ${ENDPOINT}`, error);
    await notifyFailure(-1, error.message);

    return createResponse(`Error fetching endpoint: ${error.message}`, 500);
  }
}

function createResponse(message, status) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain' }
  });
}

async function notifyFailure(duration, error = '') {
  const message = duration === -1
    ? `Failed to load the endpoint ${ENDPOINT}: ${error}`
    : `The endpoint ${ENDPOINT} is taking too long to load.`;

  await fetch(NOTIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }) 
  });
}


addEventListener('fetch', event => {
  event.respondWith(checkEndpoint());
});