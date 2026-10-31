<div align="center">

# 🧩 SudoKlar — Sudoku en React

### *Un poco de lógica. Mucho de calma.* 🌿

**La misma experiencia de Sudoku, ahora construida con React y Vite.**

[🎮 Jugar en local](#-cómo-ejecutarlo) · [✨ Funciones](#-qué-incluye) · [📜 Licencia](./LICENSE)

</div>

---

## 👋 ¡Bienvenid@!

SudoKlar es una aplicación web para **jugar, validar, generar y resolver sudokus** de 9 × 9. Es la versión en React del proyecto original, con una interfaz responsive, guardado automático y puzzles con solución única.

> *Un tablero, nueve números y toda la tranquilidad para pensar.* ☕

## ✨ Qué incluye

- 🎲 **Sudokus nuevos** con tres niveles: *Tranquilo*, *Intermedio* y *Desafiante*.
- 🧠 **Resolución automática** con backtracking y selección de la casilla con menos candidatos.
- 💡 **Pistas** para revelar el siguiente número correcto.
- ✅ **Validación inmediata** de filas, columnas y cuadros de 3 × 3; los conflictos se resaltan.
- ⌨️ **Edición accesible** con teclado, navegación con flechas y casillas iniciales protegidas.
- ⏱️ **Cronómetro y récords** por dificultad.
- 💾 **Guardado automático** del tablero y el tiempo en `localStorage`.
- 📱 **Diseño adaptable** para computadora y móvil.
- 🧪 **Pruebas automatizadas** para el solver, el validador y el generador de puzzles.

## 🚀 Cómo ejecutarlo

Necesitas **Node.js 20 o posterior** y npm.

```bash
# Entra a esta carpeta
cd react-rjss-solver

# Instala las dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev
```

Abre en el navegador la dirección que indique Vite (normalmente `http://localhost:5173`).

### 🏗️ Compilar para producción

```bash
npm run build
npm run preview
```

Los archivos listos para publicar se generan en `dist/`. La configuración usa rutas relativas para facilitar la publicación en **GitHub Pages**, incluso dentro de un repositorio con varios proyectos.

### 🧪 Ejecutar las pruebas

```bash
npm test
```

## 🎮 Cómo jugar

1. Elige la dificultad y pulsa **Nuevo Sudoku** para comenzar un reto.
2. Escribe números del **1 al 9**; borra una casilla con `Backspace` o `Delete`.
3. Usa las **flechas del teclado** para moverte por el tablero.
4. Pulsa **Dar pista** para revelar una respuesta o **Resolver** para completar el tablero.
5. **Cargar ejemplo** abre un Sudoku conocido; **Limpiar** deja el tablero vacío para que ingreses el tuyo.

Las reglas son sencillas: cada número debe aparecer una sola vez en cada fila, columna y cuadro de 3 × 3. ¡A disfrutar! 🎉

## 🛠️ Tecnologías

| Tecnología | Uso |
| --- | --- |
| ⚛️ React | Interfaz y estado de la aplicación |
| ⚡ Vite | Desarrollo y compilación |
| 🟨 JavaScript | Reglas, generación y resolución de Sudoku |
| 🎨 CSS | Diseño responsive |
| 🧪 Node.js Test Runner | Pruebas automatizadas |

## 📁 Estructura

```text
react-rjss-solver/
├── src/
│   ├── App.jsx          # Interfaz y comportamiento React
│   ├── main.jsx         # Entrada de la aplicación
│   ├── sudoku.js        # Solver, validador y generador
│   └── styles.css       # Estilos responsive
├── tests/
│   └── sudoku.test.js   # Pruebas de la lógica Sudoku
├── index.html
├── LICENSE
├── package.json
└── vite.config.js
```

## 📜 Licencia

Publicado bajo la **Licencia MIT**. Consulta el archivo [LICENSE](./LICENSE) para ver el texto completo.

---

<div align="center">

*Hecho para pensar con calma.* 💚

</div>
