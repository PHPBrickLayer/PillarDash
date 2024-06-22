## How To Use

**Please note:**\
This package is to be used in the web side of the framework and not on the brick side;
because some of the classes are being accessed like the `DomainResource` class are only 
available on the web side of the framework, and not the server side.

### Get Started
To get started, you need to link static assets to the ui folder of the domain you wish to use this package with, like this:
```shell
php bob link:dir utils/PillarDash/assets web/domains/Default/static/dev/ui/assets
```

Then navigate to the `layout` folder and do the following in the appropriate files:

```php
# /web/domains/Default/layout/head.inc
\utils\PillarDash\Layout::head();
```

```php
# /web/domains/Default/layout/script.inc
\utils\PillarDash\Layout::script();
```

```php
# /web/domains/Default/layout/body.inc
\utils\PillarDash\Layout::body();
```
### Creating Header Section

```php
Layout::header(
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
        "@ui/assets/media/avatars/300-2.jpg",
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
### Creating Sidebar Menu
To create a sidebar menu, do the following inside the `body.inc` file, right before `Layout::body()`

```php
\utils\PillarDash\Layout::sidebar(
    \utils\PillarDash\Menu::make(
        menu_name: "Blog",
        route_id: "blog",
        icon: "ki-message-edit",
        permit: true,
        items: 
            [
                "name" => "Published Articles",
                "url" => "blog/published",
                "title" => "This page consists of all published articles"
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
As you noticed, there are various keys you can pass to the `items` argument. Type hinting is enabled and will assist you along the way.
You can also pass `Menu::make` multiple times. Whenever you call `Menu::make`, you create a new menu section.