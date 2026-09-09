#!/usr/bin/env bash
set -euo pipefail

# Chạy tại thư mục frontend/ :  bash setup-structure.sh

# ---- src/ (file gốc) ----
mkdir -p src
touch src/main.tsx src/vite-env.d.ts

# ---- src/styles ----
mkdir -p src/styles
touch src/styles/global.css

# ---- src/app ----
mkdir -p src/app/providers
touch src/app/App.tsx src/app/router.tsx src/app/store.ts \
      src/app/providers/index.ts \
      src/app/providers/QueryProvider.tsx \
      src/app/providers/RouterProvider.tsx

# ---- src/lib ----
mkdir -p src/lib
touch src/lib/axios.ts src/lib/env.ts src/lib/queryClient.ts src/lib/utils.ts

# ---- src/shared ----
mkdir -p src/shared/components/common \
         src/shared/components/guards \
         src/shared/components/ui \
         src/shared/constants \
         src/shared/hooks \
         src/shared/layouts \
         src/shared/pages \
         src/shared/services \
         src/shared/types
touch src/shared/components/common/index.ts \
      src/shared/components/guards/index.ts \
      src/shared/components/ui/index.ts \
      src/shared/constants/index.ts \
      src/shared/hooks/index.ts \
      src/shared/layouts/index.ts \
      src/shared/pages/index.ts \
      src/shared/services/index.ts \
      src/shared/types/index.ts

# ---- src/features (events, heatmap, participants) ----
for f in events heatmap participants; do
  mkdir -p "src/features/$f/components" \
           "src/features/$f/hooks" \
           "src/features/$f/pages"
  touch "src/features/$f/components/.gitkeep" \
        "src/features/$f/hooks/.gitkeep" \
        "src/features/$f/pages/.gitkeep" \
        "src/features/$f/index.ts" \
        "src/features/$f/schema.ts" \
        "src/features/$f/services.ts" \
        "src/features/$f/store.ts" \
        "src/features/$f/types.ts"
done

echo "✅ Done: cây thư mục src đã được tạo."
