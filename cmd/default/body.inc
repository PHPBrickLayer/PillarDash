<?php

use Utils\Services\PillarDash\Header;
use Utils\Services\PillarDash\Layout;
use Utils\Services\PillarDash\Menu;

Layout::outside(function () {
    $meta = \BrickLayer\Lay\Core\View\DomainResource::plaster();
    $section = $meta->local->section;

    if($section == "app")
        return false;

    $section  = $section == "auth" ? "flex-lg-row" : "flex-center";

    echo <<<DIV
    <div class="d-flex flex-column flex-root" id="kt_app_root">
        <div class="d-flex flex-column $section flex-column-fluid">$meta->body</div>
    </div>
    DIV;

    return true;
});

Layout::header(
    Header::logo(
        "@shared_img/icon.png",
        " ",
        "height: 50px; width: 50px"
    ),

    Header::favourite(
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

    Header::user_nav(
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

Layout::sidebar(
    "auto",
    Menu::make(
        "Dashboard",
        "ki-home-3",
        true,
        [
            "name" => "Dashboard",
            "url" => "./",
            "title" => "This page consists of all published articles"
        ],
    ),
    Menu::make(
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

Layout::body();