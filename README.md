## Introduction
This is a dashboard created for use on [bricklayer/lay](https://github.com/PHPBrickLayer/lay) framework, and it was created using [metronic dashboard](https://keenthemes.com/metronic).

### How To Use
This package is to be used on the `web` side of the framework and not on the `brick (server side)` side;
because some of the classes used, like the `DomainResource` class are only
available on the `web` side of the framework, and not the server side.

### Get Started
To get started, you need to clone this repo and move it into the `utils` folder of your application.

There are two (2) ways to get started after cloning; 
1. **fall_from_sky** 
2. **raw_doug** 

Before making a choice, ensure you've created the domain entry you wish to use this dashboard on. If you haven't simply run the command 
below. Please not I'm assuming the domain you will be creating here is `User` and the pattern is `user`; hence:

```shell
php bob make:domain User user
```

**Now you're ready to pick a _"get started"_ method.**
**For the rest of this documentation, I will assume you're using a domain called `User`**

### fall_from_sky (recommended)
This is the easiest method as the name implies. Simply run the command below
```shell
php utils/PillarDash/cmd/init.php User
```
Now open your project and navigate to the user domain url, and that's all.

### raw_doug
Follow these processes closely to raw dog successfully.

- Use the command below to link the `static` directory to the `ui` directory of the designated domain you're working with:
  ```shell
  php bob link:dir utils/PillarDash/static web/domains/User/static/dev/ui/static
  ```
- Then navigate to the `layout` folder and do the following in the appropriate files as commented:
  ```php
  # /web/domains/User/layout/head.inc
  \utils\PillarDash\Layout::head();
  ```
  ```php
  # /web/domains/User/layout/script.inc
  \utils\PillarDash\Layout::script();
  ```
  ```php
  # /web/domains/User/layout/body.inc
  \utils\PillarDash\Layout::body();
  ```
### Editing `body.inc`
Open the `body.inc` file and do the following to set up the header, sidebar and every other required component. 
Everything you will be doing on this `body.inc` file should happen before the declaration of `Layout::body()`, meaning
`Layout::body()` should be the last statement on the page. This is because the method `Layout::body()` responsible for rendering the whole page.

#### Outside Component
This method is meant to preserve the active theme (light or dark) of the dashboard while ignoring the `header` and `sidebar` components.
Use this when rendering the **error** and **auth** pages.\
Ensure to pass `->local("section", "error")` for error pages or `->local("section", "auth")` for auth pages.

```php
\utils\PillarDash\Layout::outside(function () {
    $meta = \BrickLayer\Lay\Core\View\DomainResource::plaster();
    $section = $meta->local->section;
  
    if($section == "app")
        return false;
  
    $section  = $section == "auth" ? "flex-lg-row" : "flex-center";
  
    echo <<<DIV
    <div class="d-flex flex-column flex-root $section" id="kt_app_root">
        <div class="d-flex flex-column flex-center flex-column-fluid">$meta->body</div>
    </div>
    DIV;
  
    return true;
});
```
#### Header Component
```php
\utils\PillarDash\Layout::header(
    \utils\PillarDash\Header::logo(
        "@shared_img/logo.png",
    ),

    \utils\PillarDash\Header::favourite(
        function (){ ?>
            <a href="blog/compose" class="d-flex align-items-center gap-2 flex-wrap justify-content-center">
                <div class="rounded d-flex flex-center w-40px h-40px flex-shrink-0 bg-warning">
                    <i class="ki-outline ki-notepad-edit fs-2 text-inverse-warning"></i>
                </div>
                <div class="d-flex flex-column">
                    <span class="fw-bold fs-base text-gray-900 text-center text-md-start">Compose</span>
                    <span class="fw-semibold fs-7 text-gray-500">New Blog Post</span>
                </div>
            </a>
            <a href="blog/keywords" class="d-flex align-items-center gap-2 flex-wrap justify-content-center">
                <div class="rounded d-flex flex-center w-40px h-40px flex-shrink-0 bg-danger">
                    <i class="ki-outline ki-ranking fs-2 text-inverse-danger"></i>
                </div>
                <div class="d-flex flex-column">
                    <span class="fw-bold fs-base text-gray-900 text-center text-md-start">Keywords</span>
                    <span class="fw-semibold fs-7 text-gray-500">Trending Search</span>
                </div>
            </a>
            <a href="blog/search" class="d-flex align-items-center gap-2 flex-wrap justify-content-center">
                <div class="rounded d-flex flex-center w-40px h-40px flex-shrink-0 bg-primary">
                    <i class="ki-outline ki-search-list fs-2 text-inverse-primary"></i>
                </div>
                <div class="d-flex flex-column">
                    <span class="fw-bold fs-base text-gray-900 text-center text-md-start">Blog Search</span>
                    <span class="fw-semibold fs-7 text-gray-500">Search the whole DB</span>
                </div>
            </a>
        <?php }
    ),

    \utils\PillarDash\Header::user_nav(
        "Brownian Motion",
        "brownian.motion@mot.ion",
        "@ui/static/assets/media/avatars/300-2.jpg",
        [
            "name" => "Profile",
            "url" => "profile",
        ],
        [
            "name" => "Change Password",
            "class" => "change-password"
        ],
        [],
        [
            "name" => "Sign Out",
            "url" => "sign-out",
        ]
    ),
);
```
#### Sidebar Component
To create a sidebar menu component, do the following inside the `body.inc` file.
```php
\utils\PillarDash\Layout::sidebar(
  "auto",
  \utils\PillarDash\Menu::make(
      "Dashboard",
      "ki-home-3",
      true,
      [
          "name" => "Dashboard",
            "url" => "./",
            "title" => "This page consists of all published articles"
        ],
    ),
    \utils\PillarDash\Menu::make(
        "Blog",
        "ki-message-edit",
        true,
        [
            "name" => "Published Articles",
            "url" => "blog/published",
            "title" => "This page consists of all published articles",
        ],
        [
            "name" => "Draft Articles",
            "url" => "blog/drafts",
            "icon" => "ki-archive"
        ],
        [
            "name" => "Scheduled Articles",
            "url" => "blog/scheduled",
            "permit" => false
        ],
    ),
  );
```
As you noticed, there are various keys you can pass to the `items` argument. Type hinting is enabled and will assist you along the way. You can also pass `Menu::make` multiple times. Whenever you call `Menu::make`, you create a new menu section.

### Editing `Plaster.php`
```php
# /web/domains/User/Plaster.php

public function init_pages(): void
{
    $this->builder->init_start()
        ->body_attr(\utils\PillarDash\Layout::BODY_ATTR['class'], \utils\PillarDash\Layout::BODY_ATTR['attr'])
        ->local("section", "app")
    ->init_end();
}

public function pages(): void
{
    $this->builder->route("index")->bind(function (ViewBuilder $builder) {
        $builder->page("title", "Homepage")
            ->page("desc", "This is the default homepage description")
            ->body("homepage");
    });
}

public function default(): void {
    $this->builder->route($this->builder::DEFAULT_ROUTE)->bind(function (ViewBuilder $builder) {
        $builder->page("title", "Oops!")
            ->page("desc", "Emm... `{$builder->request('route')}`, we can't find that page")
            ->body_attr(Page::E_ATTR['class'], Page::E_ATTR['attr'])
            ->local("current_page", "error")
            ->local("section", "error")
            ->body(function (){
                echo Page::e_404();
            });
    });
}
```

### Editing `homepage.view`
```php
<?php

use utils\PillarDash\Page;

// This is only used here because of the script tag at the bottom of the page
Page::using_table(false);

Page::table(
    tid: "homepage-table",
    thead: [
        "Title",
        "Author", "Category",
        "Created", "Updated",
        "Actions",
    ],
    tbody: [
        [
            "Sample Blog",
            "Brownian Motion", "Lifestyle",
            "2024-06-22", "a minute ago",
            [<<<ACT
            <div class="card-toolbar">
                
                <button type="button" class="btn btn-icon btn-color-gray-400 btn-active-color-primary justify-content-end menu-dropdown" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                    <i class="ki-outline ki-dots-square fs-1 text-gray-400 me-n1"></i>
                </button>
                <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold w-auto min-w-200 mw-300px" data-kt-menu="true" style="z-index: 107; position: fixed; inset: 0px 0px auto auto; margin: 0px; transform: translate3d(-83px, 412px, 0px);" data-popper-placement="bottom-end">
                    <!--begin::Menu item-->
                    <div class="menu-item px-3">
                        <div class="menu-content fs-6 text-dark fw-bold px-3 py-4 text-center">Actions</div>
                    </div>
                    
                    <div class="menu-item px-3"><a href="http://clients.osai/wallchart/blog/2024-african-safari-lodges-guide?mode=preview" target="_blank" class="menu-link px-3  " data-id="4b44484f-1ba6-11ef-a5fa-0affc1ea3365" data-name="2024%20African%20Safari%20Lodges%20Guide" data-action="undefined">Preview Blog</a></div><div class="separator mb-3 opacity-75"></div><div class="menu-item px-3"><a href="http://clients.osai/wallchart/office/blog/compose/4b44484f-1ba6-11ef-a5fa-0affc1ea3365" target="_blank" class="menu-link px-3  " data-id="4b44484f-1ba6-11ef-a5fa-0affc1ea3365" data-name="2024%20African%20Safari%20Lodges%20Guide" data-action="undefined">Edit Blog</a></div><div class="separator mb-3 opacity-75"></div><div class="separator mb-3 opacity-75"></div><div class="menu-item px-3"><div class="menu-content px-3 py-3" style="text-align: center"><a href="javascript:void(0);" class=" px-3 table-action btn btn-danger btn-sm" data-id="4b44484f-1ba6-11ef-a5fa-0affc1ea3365" data-name="2024%20African%20Safari%20Lodges%20Guide" data-action="delete">Delete Item</a></div></div>
                </div>
            </div>
            ACT, "text-end no-sort"]
        ],
        [
            "Sample Blog",
            "Brownian Motion", "Lifestyle",
            "2024-05-02", "a minute ago",
            [<<<ACT
            <div class="card-toolbar">
                
                <button type="button" class="btn btn-icon btn-color-gray-400 btn-active-color-primary justify-content-end menu-dropdown" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                    <i class="ki-outline ki-dots-square fs-1 text-gray-400 me-n1"></i>
                </button>
                <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold w-auto min-w-200 mw-300px" data-kt-menu="true" style="z-index: 107; position: fixed; inset: 0px 0px auto auto; margin: 0px; transform: translate3d(-83px, 412px, 0px);" data-popper-placement="bottom-end">
                    <!--begin::Menu item-->
                    <div class="menu-item px-3">
                        <div class="menu-content fs-6 text-dark fw-bold px-3 py-4 text-center">Actions</div>
                    </div>
                    
                    <div class="menu-item px-3"><a href="http://clients.osai/wallchart/blog/2024-african-safari-lodges-guide?mode=preview" target="_blank" class="menu-link px-3  " data-id="4b44484f-1ba6-11ef-a5fa-0affc1ea3365" data-name="2024%20African%20Safari%20Lodges%20Guide" data-action="undefined">Preview Blog</a></div><div class="separator mb-3 opacity-75"></div><div class="menu-item px-3"><a href="http://clients.osai/wallchart/office/blog/compose/4b44484f-1ba6-11ef-a5fa-0affc1ea3365" target="_blank" class="menu-link px-3  " data-id="4b44484f-1ba6-11ef-a5fa-0affc1ea3365" data-name="2024%20African%20Safari%20Lodges%20Guide" data-action="undefined">Edit Blog</a></div><div class="separator mb-3 opacity-75"></div><div class="separator mb-3 opacity-75"></div><div class="menu-item px-3"><div class="menu-content px-3 py-3" style="text-align: center"><a href="javascript:void(0);" class=" px-3 table-action btn btn-danger btn-sm" data-id="4b44484f-1ba6-11ef-a5fa-0affc1ea3365" data-name="2024%20African%20Safari%20Lodges%20Guide" data-action="delete">Delete Item</a></div></div>
                </div>
            </div>
            ACT, "text-end no-sort"]
        ],

    ],
    topts: [
        "date" => [4, "YYYY-MM-DD"],
        "filter" => [
            "column" => "Category",
            "rules" => []
        ],
    ]
);
?>

@script
<script>
    dataTable({})
</script>
@endscript
```