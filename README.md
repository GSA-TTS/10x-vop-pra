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

### Update the site.yaml url

Currently, the url in the site.yaml file points to the Preview Cloud Pages main branch link. Once this site has a permanent domain, the url will need to be updated.

---

### ICR Form Builder Wizard  

This site includes an **ICR Form Builder**, a five-part wizard designed to guide users through form creation. This feature was implemented but will not be included in the first version of the wizard due to infrastructure limitations. However, future versions may reintroduce it with the necessary backend services.  

#### File Structure  

- **Wizard UI**: [`icr-form-builder.html`](./_includes/layouts/icr-form-builder.html)  
- **Wizard Logic**: [`icr-form-wizard.js`](./_includes/theme/js/icr-form-wizard.js)  
- **Server Logic**: [`server.js`](./server/server.js)  

#### Key Features  

- **Session Persistence**: Each session is assigned a unique token, allowing users to bookmark the form URL and return later without logging in.  
- **Database Storage**: Sessions and tokens are stored in an **AWS relational MySQL database (RDS)**.  
- **Form Preview**: The wizard includes an **iframe preview**, where the form is temporarily stored in an **AWS S3 bucket** before finalization.  
- **Progress Tracking**: Users can resume incomplete forms by leveraging stored session data.  

Both the **S3 bucket** and **database** were originally part of the **10x Cloud server infrastructure**.  

#### Future Implementation  

To reintroduce these features in a future version, the following AWS services need to be set up and integrated into the project:  

##### 1. AWS RDS (Relational Database Service)  

- Used to store **session tokens** and **form progress**.  
- The database schema should include:  
  - A table for storing unique session tokens mapped to user progress.  
  - A table for temporarily saving form data before submission.  
- Developers will need to update [`server.js`](./server/server.js) to use the new database credentials.  

##### 2. AWS S3 (Simple Storage Service)  

- Used to **store form preview files** before submission.  
- The bucket must be configured to allow temporary storage and retrieval.  
- Future developers should update [`server.js`](./server/server.js) to:  
  - Upload form previews to S3.  
  - Generate temporary access URLs for the preview iframe.  

##### 3. Server Modifications  

- Update [`server.js`](./server/server.js) to:  
  - Use environment variables for AWS credentials (`.env` file recommended).  
  - Handle database connections securely.  
  - Implement proper error handling and cleanup for expired sessions.  

##### 4. Security Considerations  

- Ensure that **AWS IAM roles** are configured properly to restrict database and S3 access.  
- Use **signed URLs** for temporary file access in S3.  
- Regularly purge old session records and temporary preview files to maintain efficiency.  

#### Next Steps  

- Future developers should review the existing implementation in [`server.js`](./server/server.js) and adapt it to their AWS infrastructure.  
- AWS documentation provides setup guidance:  
  - [Set up an AWS RDS MySQL Database](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.MySQL.html)  
  - [Set up an AWS S3 Bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html)  
- If using **Cloud.gov** instead of AWS, refer to their documentation:  
  - [S3](https://cloud.gov/docs/services/s3/)  
  - [RDS - Relational databases](https://cloud.gov/docs/services/relational-database/)  

**Note:** If the agency chooses **Cloud.gov** instead of AWS, developers will need to update [`server.js`](./server/server.js) accordingly to support the new infrastructure.
