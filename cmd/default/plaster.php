
use BrickLayer\Lay\Core\View\ViewBuilder;
use BrickLayer\Lay\Core\View\ViewCast;
use utils\PillarDash\Layout;
use utils\PillarDash\Page;

class Plaster extends ViewCast
{
    public function init_pages(): void
    {
        $this->builder->init_start()
            ->body_attr(Layout::BODY_ATTR['class'], Layout::BODY_ATTR['attr'])
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
}
