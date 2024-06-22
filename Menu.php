<?php

namespace utils\PillarDash;

use BrickLayer\Lay\Core\Traits\IsSingleton;
use BrickLayer\Lay\Core\View\DomainResource;
use BrickLayer\Lay\Core\View\Tags\Anchor;
use JetBrains\PhpStorm\ArrayShape;

final class Menu
{
    use IsSingleton;

    private static string $menu_store = "";

    private static array $route_data;

    private static function href(string|bool|null...$args) : string
    {
        return Anchor::new()->href(...$args)->get_href();
    }

    private static function set_route_data(string $route_id) : array
    {
        $domain = DomainResource::get()->domain;

        return self::$route_data = [
            "route" => $domain->route,
            "route_as_array" => $domain->route_as_array,
            "domain_id" => $domain->domain_id,
            "is_1d" => $domain->route_as_array[0] == $route_id ? "here" : "",
        ];
    }

    private static function dto(array $data) : array
    {
        $url = $data['url'] ?? null;

        $active = "";

        if($url == "./")
            $data['url'] = "index";

        $domain_id = $data['domain_id'] ?? self::$route_data['domain_id'];

        if(self::$route_data['route'] == @$data['url'] && self::$route_data['domain_id'] == $domain_id)
            $active = "active";

        return [
            "icon"    => $data['icon'] ?? null,
            "target"    => $data['target'] ?? "_self",
            "name"      => $data['name'],
            "title"     => $data['title'] ?? $data['name'],
            "url"       => $url ? self::href($url, $data['domain_id'] ?? null) : 'javascript:void(0)',
            "active"    => $active,
            "permit" => $data['permit'] ?? true,
            "module_id" => $data['module_id'] ?? null,
        ];
    }

    private static function class_menu_item(array $item_obj, &$here = null) : string
    {
        $bullet = '<span class="menu-bullet"><span class="bullet bullet-dot"></span></span>';
        $icon = !$item_obj['icon'] ? $bullet :  '<span class="menu-icon"><i class="ki-outline ' . $item_obj['icon'] .' fs-2"></i></span>';

        if($item_obj['active'])
            $here = true;

        return <<<MENU
        <div class="menu-item">
            <a class="menu-link {$item_obj['active']}" href="{$item_obj['url']}" target="{$item_obj['target']}" title="{$item_obj['title']}" data-bs-toggle="tooltip" data-bs-trigger="hover" data-bs-dismiss="click" data-bs-placement="right">
                $icon
                <span class="menu-title">{$item_obj['name']}</span>
            </a>
        </div>
        MENU;
    }

    private static function class_menu_link(string $title, ?string $icon = null) : string
    {
        $bullet = '<span class="menu-bullet"><span class="bullet bullet-dot"></span></span>';
        $icon = !$icon ? $bullet :  '<span class="menu-icon"><i class="ki-outline ' . $icon .' fs-2"></i></span>';

        return <<<MENU
        <span class="menu-link">
            $icon
            <span class="menu-title">$title</span>
            <span class="menu-arrow"></span>
        </span>
        MENU;
    }

    private static function make_sub_menu(array $menu_list, &$nD = null) : string
    {
        $menu_items = "";
        $here = null;

        foreach ($menu_list as $item) {
            $dto = self::dto($item);

            if(isset($item['sub'])) {
                $x = self::make_sub_menu($item['sub'], $here);
                $x = self::class_menu_link($dto['title'], $dto['icon']) . $x;
                $d3 = $here ? "here hover show" : "";
                $menu_items .= '<div class="menu-item ' . $d3 .' menu-accordion" data-kt-menu-trigger="click">' . $x . '</div>';
                continue;
            }

            $menu_items .= self::class_menu_item($dto, $here);
        }

        $d2 = $here ? "here hover show" : "";
        $nD = $here;

        return '<div class="menu-sub menu-sub-accordion ' . $d2 . '">' . $menu_items . '</div>';
    }

    public static function render() : string
    {
        $made_menu = self::$menu_store;

        return <<<CONTAINER
        <div id="kt_app_sidebar"
             class="app-sidebar"                    data-kt-drawer="true"
             data-kt-drawer-name="app-sidebar"      data-kt-drawer-activate="{default: true, lg: false}"
             data-kt-drawer-overlay="true"          data-kt-drawer-width="auto"
             data-kt-drawer-direction="start"       data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle"
        >
            <div id="kt_aside_menu_wrapper"
                 class="app-sidebar-menu flex-grow-1 hover-scroll-y scroll-lg-ps my-5 pt-8"
                 data-kt-scroll="true" data-kt-scroll-height="auto" data-kt-scroll-dependencies="#kt_app_sidebar_logo, #kt_app_sidebar_footer"
                 data-kt-scroll-wrappers="#kt_app_sidebar_menu" data-kt-scroll-offset="5px"
            >
                <div 
                    id="kt_aside_menu" 
                    class="menu menu-rounded menu-column menu-title-gray-600 menu-state-primary menu-state-icon-primary menu-state-bullet-primary menu-arrow-gray-500 fw-semibold fs-6" 
                    data-kt-menu="true"
                >
                    $made_menu
                </div>
            </div>
            
            <div class="d-flex flex-column flex-center pb-4 pb-lg-8" id="kt_app_sidebar_footer">
                <a href="#" class="btn btn-icon btn-active-color-primary" data-kt-menu-trigger="{default:'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
                    <i class="ki-outline ki-night-day theme-light-show fs-2x"></i>
                    <i class="ki-outline ki-moon theme-dark-show fs-2x"></i>
                </a>
                <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-title-gray-700 menu-icon-gray-500 menu-active-bg menu-state-color fw-semibold py-4 fs-base w-150px" data-kt-menu="true" data-kt-element="theme-mode-menu">
                    <div class="menu-item px-3 my-0">
                        <a href="#" class="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="light">
                            <span class="menu-icon" data-kt-element="icon">
                                <i class="ki-outline ki-night-day fs-2"></i>
                            </span>
                            <span class="menu-title">Light</span>
                        </a>
                    </div>
                    <div class="menu-item px-3 my-0">
                        <a href="#" class="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="dark">
                            <span class="menu-icon" data-kt-element="icon">
                                <i class="ki-outline ki-moon fs-2"></i>
                            </span>
                            <span class="menu-title">Dark</span>
                        </a>
                    </div>
                    <div class="menu-item px-3 my-0">
                        <a href="#" class="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="system">
                            <span class="menu-icon" data-kt-element="icon">
                                <i class="ki-outline ki-screen fs-2"></i>
                            </span>
                            <span class="menu-title">System</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        CONTAINER;
    }

    /**
     * Create menu sections on the sidebar. Each call to this method creates a new menu section
     *
     * @param string $menu_name
     * @param string $route_id
     * @param string $icon
     * @param bool|null $permit
     * @param array ...$items
     * @return self
     */
    public static function make(
        string $menu_name,  string $route_id,
        string $icon,       ?bool $permit,
        #[ArrayShape([
            'name' => 'string',
            'title' => 'string',
            'url' => 'string',
            'sub' => 'array',
            'icon' => 'string',
            'permit' => 'bool',
            'domain_id' => 'string',
            'target' => 'string',
        ])] array  ...$items
    ) : self
    {
        if ($permit === false)
            return self::new();

        self::set_route_data($route_id);

        $menu_entries = "<div>There is currently no menu entry</div>";
        $menu_still_blank = true;
        $is_1d = self::$route_data['is_1d'];
        $is_2d = null;

        foreach ($items as $d) {
            $dto = self::dto($d);

            if (!$dto['permit'])
                continue;

            if ($menu_still_blank)
                $menu_entries = "";

            $menu_still_blank = false;

            if (!isset($d['sub'])) {
                $menu_entries .= self::class_menu_item($dto);
                continue;
            }

            $x = self::make_sub_menu($d['sub'], $is_2d);
            $menu_entries .= self::class_menu_link($dto['name'], $dto['icon']) . $x;
        }

        $is_2d = $is_2d ? "here hover show" : "";

        self::$menu_store .= <<<STORE
        <div data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-placement="right-start" class="menu-item py-2 $is_1d">
            <div class="menu-link menu-center flex-column w-100 mb-5">
                <span class="menu-icon me-0">
                    <i class="fs-1 ki-outline $icon"></i>
                </span>
                <div class="menu-title">$menu_name</div>
            </div>
            <div class="menu-sub menu-sub-dropdown menu-sub-indention px-2 py-4 w-250px mh-75 overflow-auto">
                <div class="menu-item">
                    <div class="menu-content">
                        <span class="menu-section fs-5 fw-bolder ps-1 py-1">$menu_name</span>
                    </div>
                </div>
                <div class="menu-item menu-accordion $is_2d" data-kt-menu-trigger="click">
                    $menu_entries
                </div>
            </div>
        </div>
        STORE;

        return self::new();
    }
}