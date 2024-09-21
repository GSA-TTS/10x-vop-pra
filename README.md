# TTS PRA Navigator

This is a prototype site for the TTS PRA Navigator. It's a work in progress.

## Development

### Installation & getting started

This site can be run locally using NodeJS. Using the command line, install the site and dependencies:

`npm i`

### Build all assets

To build all css assets:

```npm run assets:build```

To build for production, which compiles all css and js files:

`npm run build`

### Running a Dev Instance

`npm run dev`

## Federalist/Cloud Pages notes

Because these sites build in a directory, not the root level of a domain, we have to do a few extra thing to make sure the links and assets work.

### HTML / liquid / layouts

In templates and layouts, make sure to use the liquid `| url` filter, which will automatically prefix the `baseurl` environment variable during production builds:

```html
<a href="{{ item.link | url }}">
  <img src="{{ '/assets/theme/images/gsa-logo.svg' | url }}"/>
</a>
```

## Markdown and YAML

In markdown, make sure to not link to a root-relative page, but rather use relative links:

```

View our [projects](../projects)

```

For now, the places where we iterate over links provided in YAML lists are automatically prepended with the baseurl by the templates that use them. So this is ok:

```

yaml

- button_text: "click here"
  button_link: "/projects"
  reportUrl: "/assets/report.pdf"

```

Note that you do not use the `../` when defining permalinks for pages in YAML either.

### Styles and assets

In CSS/Sass, use relative asset paths in path variables and `url()` for images and fonts:

```scss

$theme-font-path: "theme/fonts"

.bg {
  background-image: url("theme/images/10x-logo.png");
}
```

### Referencing Images Using Shortcodes

All of your images will be stored in the `_includes/theme/images/` directory. To reference your images in your templates you can use the `shortcodes` built into the template.

For referencing an image without a style class, you will pass the template shortcode the image's source path and the alternative image name in that order. ie:

```
{% image "_includes/theme/images/my-image.png" "My PNG Image Alternative Name" %}
```

For referencing an image with a style class, you will pass the template shortcode the image's source path, class names, and the alternative image name in that order. ie:

```
{% image_with_class "_includes/theme/images/my-image.png" "img-class another-class" "My PNG Image Alternative Name" %}
```

### Referencing USWDS Sprite Icons Using Shortcodes

USWDS has sprite icons available for use. Here is the [list of icons](https://designsystem.digital.gov/components/icon/) available when using the sprite shortcode `uswds_icon` in the template. The following example is how you can reference the icon in a template.

```
{% uswds_icon "<USWDS sprite name>" %}
```

### Expanding SCSS Styles

CSS and SASS can be added or imported into the `_includes/theme/styles/styles.scss`. You can also use [USWDS Design Tokens](https://designsystem.digital.gov/design-tokens/) in the `styles/themes` files to update colors, fonts, and layout to fit your site's branding. This template uses [esbuild](https://esbuild.github.io/)and [autoprefixer](https://github.com/postcss/autoprefixer) to bundle your SASS/CSS and fingerprint the files in the site build.

### Adding custom Javascript

Javascript can be added to the admin UI or site UI by adding or importing code into the `_includes/theme/js/admin.js` or `_includes/theme/js/app.js` files respectively.
