# SK Wood Turnery — Frontend (Angular 17)

Artisan woodcraft e-commerce frontend built with Angular 17, standalone components, dynamic image caching, and responsive luxury styling.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm start
# or: npx ng serve --port 4200
```
Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### 3. Production Build
```bash
npm run build
```
Build output is saved to `dist/sk-wood-turnery`.

---

## 📦 Pushing Frontend to Its Own Repository

If you want to maintain and deploy the frontend in its own separate GitHub/GitLab repository:

```bash
# 1. Open the frontend folder
cd d:\woodturnery\frontend

# 2. Initialize Git
git init

# 3. Add files and make your initial commit
git add .
git commit -m "feat: initial frontend angular commit"

# 4. Set default branch to main
git branch -M main

# 5. Link to your new frontend GitHub repository
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_FRONTEND_REPO>.git

# 6. Push to GitHub
git push -u origin main
```
