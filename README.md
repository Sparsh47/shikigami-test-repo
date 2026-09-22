# shikigami-test-agent

A minimal AI agent app for testing an AI-agent deployment platform end to end.
It's intentionally simple — any failure you hit while deploying this is a
platform problem, not an app-code problem.

## Endpoints
- `GET /health` — plain readiness check, no dependencies. Point your
  Kubernetes readiness/liveness probes here.
- `GET /` — trivial sanity check that the container is actually serving
  traffic through your Ingress.
- `POST /chat` — body `{ "message": "hello" }`. If `GROQ_API_KEY` is set
  as an environment variable, it calls Groq (using `llama-3.3-70b-versatile`)
  and returns a real reply. If not, it returns a mock reply — so you can
  test the whole pipeline before wiring up secret injection at all.

## What this app is useful for validating
- The build: it has a real `Dockerfile`, so Kaniko has real work to do.
- The runtime: `PORT` is read from an env var and defaulted to 3000 —
  confirms your Deployment's env vars and container port config line up.
- Secrets: try deploying it once with no `GROQ_API_KEY` set (mock
  replies), then again with a real key injected as a Secret, to confirm
  your platform's secret-injection path works.
- Networking: `/health` and `/` should be reachable through whatever
  Service + Ingress hostname your platform assigns.

## Local test (before pushing through your pipeline)
```bash
npm install
GROQ_API_KEY=your-key npm start   # or omit GROQ_API_KEY to test the mock path
curl http://localhost:3000/health
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"message":"hi"}'
```
