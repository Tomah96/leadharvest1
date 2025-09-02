#!/bin/bash

echo "🚀 Installing frontend packages manually..."
echo "================================================"

mkdir -p node_modules

# Function to download and install a package
install_pkg() {
    local name=$1
    local version=$2
    local scope=$3
    
    if [ -n "$scope" ]; then
        echo "Installing @$scope/$name@$version..."
        mkdir -p "node_modules/@$scope"
        wget -q "https://registry.npmjs.org/@$scope/$name/-/$name-$version.tgz"
        tar -xzf "$name-$version.tgz"
        mkdir -p "node_modules/@$scope/$name"
        cp -r package/* "node_modules/@$scope/$name/"
        rm -rf package "$name-$version.tgz"
    else
        echo "Installing $name@$version..."
        wget -q "https://registry.npmjs.org/$name/-/$name-$version.tgz"
        tar -xzf "$name-$version.tgz"
        mkdir -p "node_modules/$name"
        cp -r package/* "node_modules/$name/"
        rm -rf package "$name-$version.tgz"
    fi
}

# Core dependencies
install_pkg "next" "14.2.15" ""
install_pkg "react" "18.3.1" ""
install_pkg "react-dom" "18.3.1" ""
install_pkg "lucide-react" "0.456.0" ""
install_pkg "axios" "1.7.7" ""
install_pkg "supabase-js" "2.46.2" "supabase"

# Next.js dependencies
install_pkg "next" "14.2.15" "next"
install_pkg "postcss" "8.4.49" ""
install_pkg "tailwindcss" "3.4.15" ""
install_pkg "autoprefixer" "10.4.20" ""

# TypeScript dependencies  
install_pkg "typescript" "5.6.3" ""
install_pkg "types" "22.9.0" "types/node"
install_pkg "types" "18.3.12" "types/react"
install_pkg "types" "18.3.1" "types/react-dom"

# React dependencies
install_pkg "scheduler" "0.23.2" ""
install_pkg "loose-envify" "1.4.0" ""
install_pkg "js-tokens" "4.0.0" ""

# Axios dependencies
install_pkg "follow-redirects" "1.15.9" ""
install_pkg "form-data" "4.0.1" ""
install_pkg "proxy-from-env" "1.1.0" ""

# PostCSS dependencies
install_pkg "nanoid" "3.3.7" ""
install_pkg "picocolors" "1.1.1" ""
install_pkg "source-map-js" "1.2.1" ""

# Tailwind dependencies
install_pkg "browserslist" "4.24.2" ""
install_pkg "caniuse-lite" "1.0.30001686" ""
install_pkg "fraction.js" "5.0.0" "fraction"
install_pkg "normalize-path" "3.0.0" ""
install_pkg "picomatch" "4.0.2" ""
install_pkg "postcss-import" "16.1.0" ""
install_pkg "postcss-js" "4.0.1" ""
install_pkg "postcss-load-config" "6.0.1" ""
install_pkg "postcss-nested" "6.2.0" ""
install_pkg "postcss-selector-parser" "7.0.0" ""
install_pkg "resolve" "1.22.8" ""
install_pkg "sucrase" "3.35.0" ""

echo ""
echo "Testing packages..."
node -e "
const tests = ['react', 'react-dom', 'axios'];
tests.forEach(pkg => {
  try {
    require(pkg);
    console.log('✅', pkg);
  } catch(e) {
    console.log('❌', pkg, ':', e.message);
  }
});
"

echo ""
echo "✨ Frontend package installation complete!"
echo "Run 'npm run dev' to start the frontend"