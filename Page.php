<?php

namespace Utils\PillarDash;

use BrickLayer\Lay\Core\View\DomainResource;
use BrickLayer\Lay\Core\View\SrcFilter;
use BrickLayer\Lay\Core\View\Tags\Anchor;
use BrickLayer\Lay\Core\View\Tags\Img;
use BrickLayer\Lay\Core\View\Tags\Script;
use JetBrains\PhpStorm\ArrayShape;

final class Page
{
    /**
     * Attach this to the `->body_attr` method of a `Plaster` class
     */
    public const E_ATTR = [
        "class" => "app-blank bgi-size-cover bgi-position-center bgi-no-repeat",
        "attr" => 'id="kt_body"',
    ];

    public static bool $table_script_added = false;

    private static function e_template(string $illustration, string $bg) : string
    {
        $page = DomainResource::plaster()->page;
        $src = Layout::__assets__();
        $fof = Img::new()->alt("Page not found")->class("mw-100 mh-300px theme-light-show")->src($src . "media/auth/$illustration.png", false)
            . Img::new()->alt("Page not found")->class("mw-100 mh-300px theme-dark-show")->src($src . "media/auth/$illustration-dark.png", false);
        $href = Anchor::new()->href()->get_href();
        $img = SrcFilter::go(Layout::__assets__() . "media/");

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

    /**
     * Render the error 404 page on a `.view` file
     * @return string
     */
    public static function e_404() : string
    {
        return self::e_template("404-error", "bg1");
    }

    /**
     * Render a generic error page on a `.view` file
     * @return string
     */
    public static function e_500() : string
    {
        return self::e_template("membership", "bg7");
    }

    /**
     * Use this to add datatable script on the page
     * @param bool $defer
     * @return void
     */
    public static function using_table(bool $defer = true) : void
    {
        if(!self::$table_script_added) {
            self::$table_script_added = true;

            $script = Script::new();
            $asset = Layout::__assets__();

            Layout::__INT_SCRIPT__(
                $script->defer($defer)->src($asset . "plugins/custom/datatables/datatables.bundle.js", false)
                . $script->defer($defer)->src($asset . "../custom/datatable.js", false)
            );

        }
    }

    /**
     * Render datatable on a page; That is a `.view` file
     * @param string $tid
     * @param array $thead
     * @param string|array|null $tbody
     * @param bool $print_table
     * @param array $topts
     * @return string
     */
    public static function table(
        string $tid,

        // Example:
        // 1.) ['Name', 'Date']
        // 2.) ['Name', ['Date', 'text-end']]
        array $thead,

        // Example:
        // 1.) [ ['Brownian Motion', '2024-06-24'], ['Brownian Motion 2', '2024-06-24'] ]
        // 2.) [ ['Brownian Motion', '<span style="text: blue">Mon Jun 24, 2024</span>'], ['Brownian Motion 2', '<span style="text: blue">Mon Jun 24, 2024</span>'] ]
        // 3.) '<tr><td>Brownian Motion</td><td>2024-06-24</td></tr> <tr><td>Brownian Motion 2</td><td>2024-06-24</td></tr>'
        string|array|null   $tbody = null,

        bool $print_table = true,

        // Every key that has `bool` or another `datatype`; accepts `false` or that `datatype`
        #[ArrayShape([
            'sn' => 'bool',
            'checkbox' => 'bool',
            'export' => 'bool',
            'search' => 'bool|string',

            'card_class' => 'string',
            'card_attr' => 'string',

            'table_class' => 'string',
            'table_attr' => 'string',

            // Example:
            // [`column`, `format`]
            // [3, 'YYYY-MM-DD']
            'date' => 'int|array',

            // Example:
            // ["column" => String, "rules" => Array<String>]
            'filter' => 'array|bool',

            // Use when you want to filter based on more than one column
            // Example:
            // ["columns" => String]
            'multi_filter' => 'array|bool',

            // HTML element of a button or whatever you want to use on the toolbar
            'toolbar' => 'string|bool',

            // The action that should show when all check boxes are clicked
            'batch_action' => 'string',

            // HTML element before the rendered table
            'table_top' => 'string',

            // HTML element after the rendered table
            'table_bottom' => 'string',
        ])] array $topts = []
    ) : string
    {
        self::using_table();
        $tid = "lay-dtable-" . $tid;

        ob_start();
        include __DIR__ . DIRECTORY_SEPARATOR . "template/datatable.inc";
        $x = ob_get_clean();

        if($print_table)
            echo $x;

        return $x;
    }


}