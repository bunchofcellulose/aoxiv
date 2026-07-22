# aoXiv

A comprehensive archive of astronomy and astrophysics olympiads — problems, solutions, and grading schemes from IOAA, INAO, and many more international, regional, and national competitions.

This project is forked from [phoxiv](https://phoxiv.org), adapted for astronomy and astrophysics olympiad archives.

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

Browsing works without any configuration. Authentication (login / profile /
contribute / admin) stays disabled until the environment variables below are set.

## Authentication & environment

aoXiv uses [better-auth](https://better-auth.com) with GitHub OAuth, backed by a
[Neon](https://neon.tech) Postgres database. Auth runs on Vercel.

1. **Create the env file** — copy the template and fill in the values:

   ```bash
   cp .env.example .env
   ```

2. **Neon Postgres** — create a project at [neon.tech](https://neon.tech) and put
   its connection string in `DATABASE_URL`.

3. **GitHub OAuth app** — create one at
   <https://github.com/settings/developers> → _New OAuth App_. Set the
   authorization callback URL to `<BETTER_AUTH_URL>/api/auth/callback/github`
   (e.g. `http://localhost:5173/api/auth/callback/github` for dev). Put the
   client ID/secret in `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.

4. **Auth secret** — generate one and put it in `BETTER_AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

5. **Create the database tables** — the auth schema (`user`, `session`,
   `account`, `verification`) lives in `src/lib/server/db/schema.ts`:

   ```bash
   bun run db:generate   # generate SQL migrations from the schema
   bun run db:migrate    # apply them to DATABASE_URL
   # or, for quick local iteration:
   bun run db:push
   ```

6. **Become an admin** — sign in with GitHub once, then set your account's `role`
   to `admin` (matching `SUPERADMIN_EMAIL`) directly in the database (e.g. via
   `bun run db:studio`). The `/admin` panel can then manage everyone else.

On Vercel, add the same variables under _Project → Settings → Environment
Variables_ and set `BETTER_AUTH_URL` / `TRUSTED_ORIGINS` to your production
domain.

> **Note:** olympiad _content_ is file-based (see below), not stored in the
> database. The `/contribute` forms are gated behind auth but do not yet persist
> content — add problems by editing the YAML and opening a PR.

## Adding more competitions

The archive data lives in `static/contests/`. Each competition is one folder, and each year is a subfolder with one year YAML.

### Directory structure

Use this shape:

```text
static/contests/
  <contest-id>/
    index.yaml
    2026/
      2026.yaml
      <pdf files...>
    2025/
      2025.yaml
      <pdf files...>
```

Rules:

- `contest-id` should be lowercase and stable (e.g. `ioaa`, `inao`).
- Year folders must be 4-digit years (`2024`, `2025`, ...).
- The year YAML filename must match the folder name exactly (`2025/2025.yaml`).
- PDF paths referenced in YAML should use `/competitions/<contest-id>/<year>/<file>.pdf`.

### `index.yaml` format (competition metadata)

Keep keys in this order for consistency:

```yaml
id: ioaa
name: International Olympiad in Astronomy and Astrophysics
shortName: IOAA
website: 'https://ioaa.org/'
summary: International olympiad for high school students focusing on astronomy and astrophysics.
icon: '🌎'
tag: International
url: 'https://ioaa.org/'
desc: |
  Short multi-line description of the contest, history, and scope.
```

Required keys used by the app:

- `id`, `name`, `shortName`, `website`
- `summary`, `icon`, `tag`, `url`, `desc`

Allowed `tag` values:

- `International`
- `Regional`
- `National`
- `Open`

### Year YAML format (`<year>/<year>.yaml`)

Full example:

```yaml
name: '2026 Astronomy and Astrophysics Olympiad'
location: 'Virtual & In-Person'
link: 'https://example.org/2026'
problemsLink: 'https://example.org/2026/problems'

papers:
  - examDuration: 180
    gradingScheme: '/competitions/aao/2026/grading_scheme.pdf'
    results: '/competitions/aao/2026/results.pdf'

  - category: 'Round 1'
    link: '/competitions/aao/2026/r1_problems.pdf'
    solutionLink: '/competitions/aao/2026/r1_solutions.pdf'
    answerSheet: '/competitions/aao/2026/r1_answer_sheet.pdf'
    results: '/competitions/aao/2026/r1_results.pdf'
    # Overrides the base template duration of 180
    examDuration: 240
    # Total contestants is strictly known
    n: 450
    camp: 85.5

    scores:
      - [99.5, 98.2, 95.0, 91.1, 88.0] # Row 1: Always TOTAL Scores
      - [20.0, 19.5, 15.0, 10.0, 10.0] # Row 2: Problem 1 Scores
      - [20.0, 20.0, 18.0, 15.0, 12.0] # Row 3: Problem 2 Scores

  - category: 'N'
    link: '/competitions/aao/2026/n_problems.pdf'
    # We don't know the total number of participants for this category,
    # so we use a tilde (~) to explicitly tell the system it is null/unknown.
    n: ~
    gold: 92.0
    silver: 80.0
    scores:
      - [98.0, 95.0, 92.0, 89.0, 80.0]
      - [20.0, 18.0, 15.0, 12.0, 10.0]

problems:
  - id: 'ao-2026-1'
    number: '1'
    name: 'Exoplanet Transit Analysis'
    category: 'Round 1'
    author: 'Dr. Jane Astronomer'
    maxScore: 20
    link: 'https://example.org/p1'
    solutionLink: 'https://example.org/s1'
    answerSheet: 'https://example.org/a1'
    gradingScheme: 'https://example.org/g1'
    results: 'https://example.org/r1'

  - id: 'ao-2026-2'
    number: '2'
    name: 'Stellar Evolution and HR Diagrams'
    category: 'Round 1'
    author: 'Prof. John Astrophysicist'

  - id: 'ao-2026-3'
    number: '3'
    name: 'Gravitational Lensing in Galaxy Clusters'
    category: 'N'
    maxScore: 15
```

Notes:

- The first `papers` item without `category` acts as a base template for all categories.
- Paper/problem resources may include `link`, `solutionLink`, `gradingScheme`, `additionalFiles`, `answerSheet`, and `results`.
- In `scores`, row 1 should be total scores; subsequent rows are per-problem scores in order.
- Use `n: ~` when participant count is unknown/incomplete.

### After adding or editing data

Regenerate derived data:

```bash
bun run pregen
```

Then start the app:

```bash
bun run dev
```

## Contributing

Want to add problems or help maintain the site? Open a PR.

## License

MIT
