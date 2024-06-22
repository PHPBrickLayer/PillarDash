<?php

namespace utils\PillarDash;

use BrickLayer\Lay\Core\View\DomainResource;
use BrickLayer\Lay\Core\View\SrcFilter;
use BrickLayer\Lay\Core\View\Tags\Anchor;
use BrickLayer\Lay\Core\View\Tags\Img;
use BrickLayer\Lay\Core\View\Tags\Script;
use JetBrains\PhpStorm\ArrayShape;

final class Page
{
    public const E_ATTR = [
        "class" => "app-blank bgi-size-cover bgi-position-center bgi-no-repeat",
        "attr" => 'id="kt_body"',
    ];

    public static bool $table_script_added = false;

    private static function e_template(string $illustration, string $bg) : string
    {
        $page = DomainResource::plaster()->page;
        $src = Layout::assets();
        $fof = Img::new()->alt("Page not found")->class("mw-100 mh-300px theme-light-show")->src($src . "media/auth/$illustration.png", false)
            . Img::new()->alt("Page not found")->class("mw-100 mh-300px theme-dark-show")->src($src . "media/auth/$illustration-dark.png", false);
        $href = Anchor::new()->href()->get_href();
        $img = SrcFilter::go("@ui/assets/media/");

        return <<<PAGE
        @style
            <style>body { background-image: url('{$img}auth/$bg.jpg'); } [data-bs-theme="dark"] body { background-image: url('{$img}auth/$bg-dark.jpg'); }</style>
        @endstyle
        
        <div class="d-flex flex-column flex-center text-center p-10">
            <div class="card card-flush w-lg-650px py-5">
                <div class="card-body py-15 py-lg-20">
                    <h1 class="fw-bolder fs-2hx text-gray-900 mb-4">$page->title_raw</h1>
                    <div class="fw-semibold fs-6 text-gray-500 mb-7">$page->desc</div>
                    
                    <div class="mb-3">$fof</div>
                    
                    <div class="mb-0">
                        <a href="$href" class="btn btn-sm btn-primary">Return Home</a>
                    </div>
                </div>
            </div>
        </div>
        PAGE;

    }

    public static function e_404() : string
    {
        return self::e_template("404-error", "bg1");
    }

    public static function e_500() : string
    {
        return self::e_template("membership", "bg7");
    }

    public static function using_table(bool $defer = true) : void
    {
        if(!self::$table_script_added) {
            self::$table_script_added = true;

            $script = Script::new();
            $asset = Layout::assets();

            Layout::__INT_SCRIPT__(
                 $script->defer($defer)->src($asset . "plugins/custom/datatables/datatables.bundle.js")
                . $script->defer($defer)->src($asset . "plugins/custom/datatables/datatables.bundle.js")
                . $script->defer($defer)->src($asset . "custom/datatable.js")
            );

        }
    }

    /**
     * Render datatable on a page
     * @param string $tid
     * @param array $thead
     * @param string|array|null $tbody
     * @param bool $print_table
     * @param array $topts
     * @return string
     */
    public static function table(
        string $tid, array $thead, string|array|null
        $tbody = null, bool $print_table = true,
        #[ArrayShape([
            'sn' => 'bool',
            'checkbox' => 'bool',
            'date' => 'int|array',
            'export' => 'bool',
            'filter' => 'array|bool',
            'toolbar' => 'string|bool',
            'batch_action' => 'string',
            'table_top' => 'string',
            'table_bottom' => 'string',
        ])] array $topts = []
    ) : string
    {
        self::using_table();

        ob_start();
        include __DIR__ . DIRECTORY_SEPARATOR . "template/datatable.inc";
        $x = ob_get_clean();

        if($print_table)
            echo $x;

        return $x;
    }


}