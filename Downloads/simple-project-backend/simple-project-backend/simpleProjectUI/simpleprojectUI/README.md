# SimpleprojectUI

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
## Theme Support

This application includes built-in dark and light mode support with the following features:

### Features
- **Automatic theme detection**: Respects system preference on first visit
- **Theme persistence**: Remembers user's theme choice in localStorage
- **Smooth transitions**: All theme changes are animated for better UX
- **Accessible**: Proper ARIA labels and focus management
- **Responsive**: Theme toggle adapts to different screen sizes

### Usage
- Click the theme toggle button in the top-right corner to switch between light and dark modes
- The theme preference is automatically saved and restored on subsequent visits
- The app will initially use your system's preferred color scheme

### Implementation
The theme system is built using:
- `ThemeService`: Manages theme state and persistence
- CSS custom properties: Enables dynamic color switching
- `ThemeToggleComponent`: Reusable theme switcher component

### Customization
To customize theme colors, modify the CSS custom properties in `src/styles.css`:

```css
:root {
  /* Light theme colors */
  --bg-primary: #ffffff;
  --text-primary: #212529;
  /* ... other variables */
}

[data-theme="dark"] {
  /* Dark theme colors */
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
  /* ... other variables */
}
```