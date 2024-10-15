<?php
/**
 * All undefined variables on this page come from the `Page::table` method
 * @see Page::table()
 */

$cols = "";

//                      //
//  OPTIONS EXTRACTION  //
//                      //

$serial_num = $topts['sn'] ?? true;
$date_range = $topts['date'] ?? false;
$export_opt = $topts['export'] ?? true;
$search_bar = $topts['search'] ?? true;

/**
 * ArrayShape
 * ['column' => 'string', 'rules' => 'array']
 * @example
 * [
"column" => "Category",
"rules" => [
"ce12-dsi" => "News",
"222-ghg" => "Entertainment",
]
]
 */
$table_filter = $topts['filter'] ?? false;
$table_multi_filter = $topts['multi_filter'] ?? false;

// Modify the message that shows when batch action is to be taken.
// This only shows when checkbox is active
$batch_act = $topts['batch_action'] ?? "Batch Action";
$check_box = $topts['checkbox'] ?? false;

$card_class = $topts['card_class'] ?? null;
$card_attr = $topts['card_attr'] ?? null;
$table_class = $topts['table_class'] ?? "table-striped table-row-bordered  border rounded";
$table_attr = $topts['table_attr'] ?? null;
$table_top = $topts['table_top'] ?? null;
$table_bottom = $topts['table_bottom'] ?? null;

$toolbar = $topts['toolbar'] ?? <<<BAR
    <button type="button" class="btn btn-primary add-new-entry">
        <span class="svg-icon svg-icon-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect opacity="0.5" x="11.364" y="20.364" width="16" height="2" rx="1" transform="rotate(-90 11.364 20.364)" fill="currentColor"></rect>
                <rect x="4.36396" y="11.364" width="16" height="2" rx="1" fill="currentColor"></rect>
            </svg>
        </span>
        New Entry
    </button>
BAR;

$tbody = $tbody ?: '<tr class="no-results-found"><td colspan="100%" style="text-align: center">There&apos;s nothing to show</td></tr>';

//                      //
//  T-HEAD EXTRACTION   //
//                      //
foreach ($thead as $th) {
    if(empty($th)) {
        $cols .= "<th class='d-none'></th>";
        continue;
    }

    if(is_array($th)) {
        $th[1] ??= "";
        $act = strtolower($th[0]);

        if($act == 'actions' || $act == 'action') {
            $th[0] = str_replace($th[0], '<i class="ki-outline ki-menu fs-2"></i>', $th[0]);
            $th[1] .= " hide-on-export no-sort";
        }

        $cols .= !empty($th[1]) ? "<th class='$th[1]'>$th[0]</th>" : "<th class='no-sort'>$th[0]</th>";
        continue;
    }

    $class = "";
    $act = strtolower($th);

    if($act == 'action' || $act == 'actions') {
        $class = "hide-on-export no-sort text-end";
        $th = str_replace($th, '<i class="ki-outline ki-menu fs-2"></i>', $th);
    }

    $cols .= "<th class='$class'>$th</th>";
}

//                      //
//  T-BODY EXTRACTION   //
//                      //
if(is_array($tbody)) {
    $x = $tbody;
    $tbody = "";
    $tbody_sn = 0;

    foreach ($x as $tb) {
        $sn = "";
        $tbody_sn++;

        if($serial_num && !$check_box)
            $sn .= "<td>$tbody_sn</td>";

        if ($check_box)
            $sn .= (
            '<td>
                    <div class="form-check form-check-sm form-check-custom form-check-solid">
                        <input class="form-check-input" type="checkbox" value="1">
                    </div>
                </td>'
            );

        $tr = $sn;
        foreach ($tb as $td){
            if(is_array($td)) {
                $td[1] ??= "";

                $tr .= "<td class='$td[1]'>$td[0]</td>";
                continue;
            }
            $tr .= "<td>$td</td>";
        }

        $tbody .= "<tr>$tr</tr>";
    }
}

$has_tools = $search_bar || $date_range || $table_filter || $table_multi_filter || $export_opt || $toolbar;
?>

<div class="card table-wrap-container <?= $card_class ?>" <?= $card_attr ?>>
    <?= $table_top ?>

    <?php if($has_tools) : ?>
        <div class="card-header border-0 pt-6 align-items-center justify-content-center">
            <div class="card-title position-relative">
                <?php if($search_bar === true) : ?>
                    <div class="d-flex align-items-center position-relative my-1">
                        <span class="svg-icon svg-icon-1 position-absolute ms-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect opacity="0.5" x="17.0365" y="15.1223" width="8.15546" height="2" rx="1" transform="rotate(45 17.0365 15.1223)" fill="currentColor"></rect>
                                <path d="M11 19C6.55556 19 3 15.4444 3 11C3 6.55556 6.55556 3 11 3C15.4444 3 19 6.55556 19 11C19 15.4444 15.4444 19 11 19ZM11 5C7.53333 5 5 7.53333 5 11C5 14.4667 7.53333 17 11 17C14.4667 17 17 14.4667 17 11C17 7.53333 14.4667 5 11 5Z" fill="currentColor"></path>
                            </svg>
                        </span>
                        <input type="search" name="search" data-kt-user-table-search="search" class="form-control search-table form-control-solid w-250px ps-14" placeholder="Search table">
                    </div>
                <?php elseif(is_string($search_bar)):
                    echo $search_bar;
                endif; ?>
                <div class="position-absolute" style="left: -45px"><button style="border-radius: 0" title="Reset table to default state" class="d-none btn btn-icon btn-lg btn-light-warning reset-table-entries"><i class="ki-outline ki-arrows-loop"></i></button></div>
            </div>

            <div class="card-toolbar justify-content-center ms-auto" data-kt-docs-table-toolbar="base">
                <?php if($date_range !== false) :
                    $date_range = !is_array($date_range) ? [
                        $date_range, "YYYY-MM-DD"
                    ] : $date_range;

                    $thead_name = $thead[$date_range[0]] ?? $thead[$date_range[0]][0];

                    if($serial_num || $check_box)
                        $thead_name = $thead[$date_range[0] - 1] ?? $thead[$date_range[0] - 1][0];
                    ?>
                    <div class="input-group w-250px me-3">
                        <button class="btn btn-icon btn-light datatable-date-goto-server" title="Search Date range on the server">
                            <i class="ki-outline ki-cloud-change fs-2"></i>
                        </button>
                        <input class="form-control form-control-solid datatable-date-picker" data-column="<?= $date_range[0] ?>" data-format="<?= $date_range[1] ?>" placeholder="Range: (<?= $thead_name ?>)" required>
                        <button class="btn btn-icon btn-light datatable-date-clear" title="Clear date range">
                            <i class="ki-outline ki-cross fs-2"></i>
                        </button>
                    </div>
                <?php endif ?>

                <?php if(!$table_multi_filter && $table_filter !== false) :
                    $table_filter = is_array($table_filter) ? $table_filter : [
                        "column" => $table_filter,
                        "rules" => []
                    ];
                    ?>
                    <div class="d-flex justify-content-end me-2">
                        <div class="w-100 mw-250px">
                            <select class="form-select form-select-solid data-table-filter" data-width="150" data-control="select2" data-hide-search="true" data-filter-column="<?= $table_filter['column'] ?>">
                                <option value="all">All</option>
                                <?php foreach ($table_filter['rules'] as $k => $f) : ?>
                                    <option value="<?= $k ?>"><?= $f ?></option>
                                <?php endforeach ?>
                            </select>
                        </div>
                    </div>
                <?php endif ?>

                <?php if($table_multi_filter !== false) :
                    $table_filter = is_array($table_multi_filter) ? $table_multi_filter : [
                        "column" => $table_multi_filter,
                        "rules" => []
                    ];
                    ?>
                    <div class="d-flex justify-content-end me-2">
                        <div class="w-100 mw-250px">
                            <!--begin::Filter-->
                            <button type="button" class="btn btn-light-primary me-3" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                <i class="ki-outline ki-filter fs-2"></i>Filter
                            </button>

                            <!--begin::Menu 1-->
                            <div class="menu menu-sub menu-sub-dropdown w-300px w-md-325px" data-kt-menu="true" data-multi-filter="true">
                                <!--begin::Header-->
                                <div class="px-7 py-5">
                                    <div class="fs-5 text-gray-900 fw-bold">Filter Options</div>
                                </div>
                                <!--end::Header-->
                                <!--begin::Separator-->
                                <div class="separator border-gray-200"></div>
                                <!--end::Separator-->
                                <!--begin::Content-->
                                <div class="px-7 py-5" data-kt-user-table-filter="form">
                                    <div class="multi-filter-body">
                                        <!--begin::Input group-->
                                        <div class="mb-10">
                                            <label class="form-label fs-6 fw-semibold">Role:</label>
                                            <select class="form-select form-select-solid fw-bold" data-kt-select2="true" data-placeholder="Select option" data-allow-clear="true" data-kt-user-table-filter="role" data-hide-search="true">
                                                <option></option>
                                                <option value="Administrator">Administrator</option>
                                                <option value="Analyst">Analyst</option>
                                                <option value="Developer">Developer</option>
                                                <option value="Support">Support</option>
                                                <option value="Trial">Trial</option>
                                            </select>
                                        </div>
                                        <!--end::Input group-->
                                        <!--begin::Input group-->
                                        <div class="mb-10">
                                            <label class="form-label fs-6 fw-semibold">Two Step Verification:</label>
                                            <select class="form-select form-select-solid fw-bold" data-kt-select2="true" data-placeholder="Select option" data-allow-clear="true" data-kt-user-table-filter="two-step" data-hide-search="true">
                                                <option></option>
                                                <option value="Enabled">Enabled</option>
                                            </select>
                                        </div>
                                        <!--end::Input group-->
                                    </div>
                                    <!--begin::Actions-->
                                    <div class="d-flex justify-content-end">
                                        <button type="reset" class="btn btn-light btn-active-light-primary fw-semibold me-2 px-6" data-kt-menu-dismiss="true" data-kt-user-table-filter="reset">Reset</button>
                                        <button type="submit" class="btn btn-primary fw-semibold px-6" data-kt-menu-dismiss="true" data-kt-user-table-filter="filter">Apply</button>
                                    </div>
                                    <!--end::Actions-->
                                </div>
                                <!--end::Content-->
                            </div>
                            <!--end::Menu 1-->
                            <!--end::Filter-->
                        </div>
                    </div>
                <?php endif ?>

                <?php if($export_opt) : ?>
                    <div class="card-toolbar gap-5 me-2">
                        <!--begin::Hide default export buttons-->
                        <div id="kt_datatable_example_1_export" class="d-none"></div>
                        <!--end::Hide default export buttons-->
                        <button type="button" class="btn btn-light-primary me-3" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                            <i class="ki-outline ki-exit-up fs-2 me-1"></i>
                            Export
                        </button>
                        <div id="kt_datatable_example_export_menu" class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-200px py-4" data-kt-menu="true">
                            <div class="menu-item px-3">
                                <a href="javascript:void(0)" class="menu-link px-3" data-kt-export="copy">
                                    Copy to clipboard
                                </a>
                            </div>

                            <div class="menu-item px-3">
                                <a href="javascript:void(0)" class="menu-link px-3" data-kt-export="excel">
                                    Export as Excel
                                </a>
                            </div>

                            <div class="menu-item px-3">
                                <a href="javascript:void(0)" class="menu-link px-3" data-kt-export="csv">
                                    Export as CSV
                                </a>
                            </div>

                            <div class="menu-item px-3">
                                <a href="javascript:void(0)" class="menu-link px-3" data-kt-export="pdf">
                                    Export as PDF
                                </a>
                            </div>
                        </div>
                        <!--begin::Hide default export buttons-->
                        <div id="kt_datatable_example_buttons" class="d-none"></div>
                        <!--end::Hide default export buttons-->
                    </div>
                <?php endif; ?>

                <?php if($toolbar) : ?>
                    <div class="d-flex justify-content-end" data-kt-user-table-toolbar="base"><?= $toolbar ?></div>
                <?php endif; ?>
            </div>

            <!--begin::Group actions-->
            <div class="d-flex justify-content-end align-items-center d-none ms-auto" data-kt-docs-table-toolbar="selected">
                <div class="fw-bolder me-5"><span class="me-2" data-kt-docs-table-select="selected_count"></span>Selected</div>
                <button type="button" class="btn btn-danger batch-action" data-kt-docs-table-select="batch_action"><?= $batch_act ?></button>
            </div>
            <!--end::Group actions-->
        </div>
    <?php endif; ?>

    <div class="card-body py-4">
        <!--begin::Table-->
        <table id="<?= $tid ?>" <?= $check_box ? 'data-has-checkbox="true"' : '' ?> class="table data-table align-middle table-row-dashed fs-6 gy-3 gs-7 <?= $table_class ?>" <?= $table_attr ?>>
            <thead>
            <tr class="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                <?php if($serial_num && !$check_box): ?>
                    <th><i class="ki-outline ki-graph fs-2"></i></th>
                <?php endif; ?>

                <?php if($check_box): ?>
                    <th class="w-10px pe-2">
                        <div class="form-check form-check-sm form-check-custom form-check-solid me-3">
                            <input class="form-check-input datatable-check-select-all" data-check-type="central" type="checkbox" data-kt-check="true" value="__SELECT_ALL__" />
                            <input type="hidden" class="datatable-check-select-all-cache" name="batch_action_values" />
                        </div>
                    </th>
                <?php endif; ?>

                <?= $cols ?>
            </tr>
            </thead>
            <tbody class="text-gray-600 fw-semibold entry-table-body"><?= $tbody ?></tbody>
        </table>
    </div>

    <?= $table_bottom ?>
</div>