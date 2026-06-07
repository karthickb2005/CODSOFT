<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# PDF Translator

This project translates PDF files to Tamil using a large language model.
# PDF Translator

This project translates PDF files to Tamil using a large language model.

## Setup

1. Create a virtual environment and activate it (recommended):

```powershell
python -m venv .venv
\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Add your Groq credentials.

- For a temporary session (PowerShell):

```powershell
$env:GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxx"
$env:GROQ_MODEL="llama-3.3-70b-versatile"
```

- Or create a `.env` file in the project root (see `.env.example`):

```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

The project uses `python-dotenv` (`load_dotenv()`) to load `.env` automatically.

## Run

Make sure `input.pdf` and `NotoSansTamil-Regular.ttf` are present in the project folder.

```powershell
cd pdf_translator
python app.py
```

## Notes

- `GROQ_API_KEY` is required. If not set, the app will raise an error.
- Change `GROQ_MODEL` in your `.env` if you want to use a different model.
- If you add the project to GitHub, keep `.env` out of source control; `.env.example` is safe to commit.
