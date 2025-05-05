<?php

namespace Utils\PillarDash;

use BrickLayer\Lay\Libs\Primitives\Traits\IsSingleton;
use BrickLayer\Lay\Core\View\DomainResource;
use BrickLayer\Lay\Core\View\SrcFilter;

final class Header
{
    use IsSingleton;
    private static string $logo_section;
    private static string $breadcrumbs;
    private static string $navbar;
    private static string $favourite;
    private static string $notification;

    public static function __render__() : string
    {
        $logo_section = self::$logo_section;
        $navbar = self::$navbar;
        $fav = self::$favourite ?? "";
        $notify = self::$notification ?? "";

        if(!isset(self::$breadcrumbs))
            self::breadcrumbs();

        $breadcrumbs = self::$breadcrumbs;

        return <<<CONT
        <div id="kt_app_header" class="app-header d-flex">
            <div class="app-container container-fluid d-flex align-items-center justify-content-between" id="kt_app_header_container">
                $logo_section
                <div class="d-flex flex-lg-grow-1 flex-stack" id="kt_app_header_wrapper">
                    <div class="app-header-wrapper d-flex align-items-center justify-content-around justify-content-lg-between flex-wrap gap-6 gap-lg-0 mb-6 mb-lg-0" data-kt-swapper="true" data-kt-swapper-mode="{default: 'prepend', lg: 'prepend'}" data-kt-swapper-parent="{default: '#kt_app_content_container', lg: '#kt_app_header_wrapper'}">
                        $breadcrumbs
                    
                        <div class="d-none d-md-block h-40px border-start border-gray-200 mx-10"></div>
                        <div class="d-flex gap-3 gap-lg-7 justify-content-center">
                            $fav
                        </div>
                    </div>
                
                    <div class="app-navbar flex-shrink-0 gap-2 gap-lg-4">
                        $notify
                        $navbar
                    </div>
                </div>
            </div>
        </div>
        CONT;
    }

    public static function logo(?string $src = null, string $class = "mh-25px mw-100 p-2", string $style = "") : self
    {
        $src = $src ? SrcFilter::go($src) : $src;

        self::$logo_section = <<<LOGO
        <div class="app-header-logo d-flex flex-center">
            <a href="./">
                <img alt="Logo" src="$src" class="$class" style="$style"/>
            </a>
            <button class="btn btn-icon btn-sm btn-active-color-primary d-flex d-lg-none" id="kt_app_sidebar_mobile_toggle">
                <i class="ki-outline ki-abstract-14 fs-1"></i>
            </button>
        </div>
        LOGO;

        return self::new() ;

    }

    /**
     * Manually set bread crumbs according to your application's taste
     * @param array|null $crumbs [0 => 'Title', 1 => 'url']
     * @return self
     */
    public static function breadcrumbs(?array $crumbs = null) : self
    {
        $page_title = DomainResource::plaster()->page->title_raw;
        $crumb_f = function (array $crumb) : string {
            $link = $crumb[0];

            if(isset($crumb[1]))
                $link = '<a href="' . $crumb[1] . '" class="text-muted text-hover-primary">' . $crumb[0] . '</a>';

            return (
                '<li class="breadcrumb-item text-muted">/</li> <li class="breadcrumb-item text-muted">' . $link . '</li>'
            );
        };
        $crumbs_str = (
        '<li class="breadcrumb-item text-muted">
                <a href="./" class="text-muted text-hover-primary">Home</a>
            </li>'
        );

        if(!$crumbs) {
            $crumbs = DomainResource::get()->domain->route_as_array;
            array_pop($crumbs);

            if(empty($crumbs))
                $crumbs_str = "";

            $crumb_cont_url = "";

            foreach ($crumbs as $crumb) {
                $crumb_cont_url .= $crumb . "/";

                $crumbs_str .= $crumb_f(
                    [
                        ucwords(str_replace(["-", "_"], " ", $crumb)),
                        $crumb_cont_url
                    ]
                );
            }
        }
        else {
            foreach ($crumbs as $crumb) {
                $crumbs_str .= $crumb_f($crumb);
            }
        }

        self::$breadcrumbs = <<<LNG
            <div class="d-flex flex-column justify-content-center">
                <h1 class="text-gray-900 fw-bold fs-6 mb-2 text-center text-md-start">$page_title</h1>
                
                <ul class="breadcrumb breadcrumb-separatorless fw-semibold fs-base">
                    $crumbs_str
                </ul>
                
            </div>
        LNG;

        return self::new();
    }

    /**
     * Accepts user navigation
     * @param string $name
     * @param string $email
     * @param string $dp
     * @param array{
     *  name: string,
     *  url: string,
     *  class: string,
     *  sub: array,
     * } ...$nav
     * @return self
     */
    public static function user_nav(
        string $name,
        string $email,
        string $dp,
        array ...$nav
    ) : self
    {
        $navs = "";
        $nav_f = function ($nav){
            $nav['url'] ??= "javascript:void(0)";
            $nav['class'] ??= "";

            return (
                '<div class="menu-item px-5">
                    <a href="' . $nav['url'] . '" class="menu-link px-5 ' . $nav['class'] . '">' . $nav['name'] . '</a>
                </div>'
            );
        };

        foreach ($nav as $n) {
            if(empty($n)) {
                $navs .= '<div class="separator my-2"></div>';
                continue;
            }

            if(!isset($n['sub'])) {
                $navs .= $nav_f($n);
                continue;
            }

            $subs = "";
            foreach ($n['sub'] as $sub) {
                $subs .= $nav_f($sub);
            }

            $navs .= <<<NAV
            <div class="menu-item px-5" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-placement="left-start" data-kt-menu-offset="-15px, 0">
                <a href="javascript:void(0)" class="menu-link px-5">
                    <span class="menu-title">{$n['name']}</span>
                    <span class="menu-arrow"></span>
                </a>
                
                <div class="menu-sub menu-sub-dropdown w-175px py-4">$subs</div>
            </div>
            NAV;
        }

        $dp = SrcFilter::go($dp);

        $img_only = <<<DP
        <div class="cursor-pointer symbol symbol-40px" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
            <img src="$dp" style="object-position: top" class="rounded-3 object-fit-cover" alt="User DP">
        </div>
        DP;

        $img_and_name = <<<DP
         <div class="cursor-pointer d-flex align-items-center border border-dashed border-gray-300 rounded p-2" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
        
            <div class="symbol me-3 symbol-35px symbol-lg-45px">
              <img src="$dp" style="object-position: top" class="rounded-3 object-fit-cover" alt="User DP">
            </div>
        
            <div class="me-4">
              <span class="fs-6 fw-bold" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">$name</span>
              <span class="text-gray-400 fs-7 fw-bold text-hover-primary" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis" title="$email">$email</span>
            </div>
        
              <i class="ki-outline ki-down fs-2 text-gray-500 pt-1"></i>
        
        </div>
        DP;


        $usr_dp_nav = isset(self::$notification) ? $img_only : $img_and_name;

        self::$navbar = <<<NAV
        <div class="app-navbar-item" id="kt_header_user_menu_toggle">
            $usr_dp_nav
            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-color fw-semibold py-4 fs-6 w-275px" data-kt-menu="true">
                <div class="menu-item px-3">
                    <div class="menu-content d-flex align-items-center px-3">
                        <div class="symbol symbol-50px me-5">
                            <img src="$dp" style="object-position: top" loading="lazy" class="object-fit-cover" alt="User DP">
                        </div>
                        <div class="d-flex flex-column overflow-hidden">
                            <div class="fw-bold d-flex align-items-center fs-5">$name
                                <span class="badge badge-light-success fw-bold fs-8 px-2 py-1 ms-2">Pro</span>
                            </div>
                            <a href="javascript:void(0);" title="$email" class="fw-semibold text-muted text-hover-primary fs-7" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">$email</a>
                        </div>
                    </div>
                </div>
                <div class="separator my-2"></div>
                $navs
            </div>
        </div>
        NAV;

        return self::new();
    }

    /**
     * @param callable $fav_list returns a string of favourite buttons
     * @return self
     */
    public static function favourite(callable $fav_list) : self
    {
        ob_start();
        $fav_list();
        self::$favourite = ob_get_clean();

        return self::new();
    }

    /**
     * @param callable $notification_list returns a string of notification menu
     * @return self
     */
    public static function notification(callable $notification_list) : self
    {
        ob_start();
        $notification_list();
        self::$notification = ob_get_clean();

        return self::new();
    }

}
