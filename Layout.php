<?php

namespace utils\PillarDash;

use BrickLayer\Lay\Core\Exception;
use BrickLayer\Lay\Core\View\DomainResource;
use BrickLayer\Lay\Core\View\SrcFilter;
use BrickLayer\Lay\Core\View\Tags\Link;
use BrickLayer\Lay\Core\View\Tags\Script;

final class Layout
{
    private static string $assets = "@ui/static/assets/";
    private static string $dashboard_scripts = "";
    private static string $header;
    private static string $sidebar;
    private static \Closure $outside_container;
    private static string $copyright = (
        '<span class="text-muted fw-semibold me-1">2024 &copy;</span>
        <a href="https://lay.osaitech.dev" target="_blank" class="text-gray-800 text-hover-primary">Lay - a Lite PHP Framework</a>'
    );

    public const BODY_ATTR = [
        "class" => "app-default",
        "attr" => 'id="kt_app_body" data-kt-app-header-fixed="true" data-kt-app-header-fixed-mobile="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true"'
    ];

    /**
     * @param string $src [default=@ui/assets/]
     * Inform the class of the location of static assets if they are not in the default location
     * @return void
     */
    public static function set_assets_src(string $src) : void
    {
        self::$assets = $src;
    }

    public static function __INT_SCRIPT__(string $script) : void
    {
        self::$dashboard_scripts .= $script;
    }

    /**
     * Get assets src
     * @return string
     */
    public static function __assets__() : string
    {
        return self::$assets;
    }

    /**
     * @param string $copyright
     * Modify the copyright at the bottom of the page
     * @return void
     */
    public static function copyright(string $copyright) : void
    {
        self::$copyright = $copyright;
    }

    /**
     * Add this method to the `head.inc` file in the layouts folder of the domain you wish to use it.
     * This method contains the mandatory css and fonts required by the dashboard
     * @return void
     */
    public static function head(): void
    {
        $link = Link::new();

        //<!--begin::Fonts(mandatory for all pages)-->
        $link->href("https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700", lazy: true);

        $link->href(self::$assets . "plugins/global/plugins.bundle.css");
        $link->href(self::$assets . "css/style.bundle.css");

        // Frame-busting to prevent site from being loaded within a frame without permission (click-jacking)
        echo "<script>if (window.top !== window.self) { window.top.location.replace(window.self.location.href); }</script>";
    }

    /**
     * Add this method to the `script.inc` file in the layouts folder of the domain you wish to use it.
     * This method contains the mandatory scripts required by the dashboard
     * @return void
     */
    public static function script(): void
    {
        echo '<script>const hostUrl = "' . SrcFilter::go(self::$assets) . '";</script>';

        $script = Script::new();
        $script->defer(false)->src(self::$assets . "plugins/global/plugins.bundle.js");
        $script->defer(false)->src(self::$assets . "js/scripts.bundle.js");

        echo self::$dashboard_scripts;
    }

    public static function outside(?callable $outside_container = null) : void
    {
        self::$outside_container = $outside_container;
    }

    /**
     * When used, the page layout is ignored, and only the callback is executed while preserving the theme script
     *
     * @note Add this method to the `body.inc` file in the layouts folder of the domain you wish to use it.
     * This is where the page body elements are rendered
     * @return void
     * @throws \Exception
     */
    public static function body() : void
    {
        // Enable page theme
        echo '<script>let defaultThemeMode = "light"; let themeMode; if ( document.documentElement ) { if ( document.documentElement.hasAttribute("data-bs-theme-mode")) { themeMode = document.documentElement.getAttribute("data-bs-theme-mode"); } else { if ( localStorage.getItem("data-bs-theme") !== null ) { themeMode = localStorage.getItem("data-bs-theme"); } else { themeMode = defaultThemeMode; } } if (themeMode === "system") { themeMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } document.documentElement.setAttribute("data-bs-theme", themeMode); }</script>';

        if(isset(self::$outside_container) && (self::$outside_container)())
            return;

        if(!isset(self::$sidebar))
            Exception::throw_exception("Sidebar Menu is not set, please use `Layout::sidebar` to create a sidebar", "NoSidebarMenu");
        ?>
        <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
            <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
                <?= self::$header ?>

                <div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                    <?= self::$sidebar ?>

                    <div class="app-main flex-column flex-row-fluid" id="kt_app_main">
                        <div class="d-flex flex-column flex-column-fluid">
                            <div id="kt_app_content" class="app-content flex-column-fluid">
                                <div id="kt_app_content_container" class="app-container container-fluid">
                                    <?= DomainResource::plaster()->body ?>
                                </div>
                            </div>
                        </div>

                        <div id="kt_app_footer" class="app-footer">
                            <div class="app-container container-fluid d-flex flex-column flex-md-row flex-center flex-md-stack py-3">
                                <div class="text-gray-900 order-2 order-md-1">
                                    <span class="text-muted fw-semibold me-1">Powered by</span>
                                    <a href="https://www.osaitech.dev" target="_blank" class="text-gray-800 text-hover-primary">
                                        <img
                                            src="https://www.osaitech.dev/shared/static/prod/images/favicon.webp"
                                            style="width: 20px; height: 20px"
                                            alt="Osai Technologies"
                                            loading="lazy"
                                        >
                                        Osai Technologies
                                    </a>
                                </div>
                                <div class="text-gray-900 order-1">
                                    <?= self::$copyright ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="kt_scrolltop" class="scrolltop" data-kt-scrolltop="true">
            <i class="ki-outline ki-arrow-up"></i>
        </div> <?php
    }

    /**
     * Create a sidebar by calling the `Menu::make` method
     * @see Menu::make
     * @param Menu ...$menu
     * @return void
     */
    public static function sidebar(Menu ...$menu) : void
    {
        self::$sidebar = Menu::render();
    }

    public static function header(
        Header ...$args
    ) : void
    {
        self::$header = Header::render();
    }

}