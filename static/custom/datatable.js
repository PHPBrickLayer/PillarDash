function dataTable({
   selector = 'table.data-table',
   destroy,
   searchTableFn,
   filterColumnIndex,
   filterColumnOptions
}) {
    const tableEl = $sel(selector).closest(".table-wrap-container")
    let tableInstance;

    if (destroy)
        return destroyTable()

    if (!$in($sel(".no-results-found"), tableEl))
        tableInstance = $(selector).DataTable({
            retrieve: true,
            order: [],
            pageLength: 25,
            fixedHeader: {
                "header": true,
                "headerOffset": 5
            },
            columnDefs: [
                {orderable: false, targets: [0, 'no-sort']},
            ],
            // responsive: true,
            oLanguage: {
                sInfo: "_START_ - _END_ of _TOTAL_",
                sInfoEmpty: "0 entries",
            },
        })

    searchOnServer()
    handleDateRange()
    handleFilterTable(filterColumnIndex, filterColumnOptions)
    handleSearchDatatable()
    exportButtons()
    checkBoxes()

    function destroyTable() {
        if (!tableInstance)
            return;

        tableInstance.clear().destroy()
        tableEl.$sel('.entry-checkbox')?.click()
    }

    function exportButtons() {
        const documentTitle = $lay.page.title;
        let columns = []
        let columnWidth = []

        // Just add the brand logo to the page before user tries to export, to prevent error due to delay in image load time
        if (!$id("temp-dtable-img-holder"))
            $html($doc.body, 'beforeend', `<img src="${$sel("[rel='icon']", $lay.page.html).href}" style="display: none" id="temp-dtable-img-holder" alt="Page Icon">`)

        tableEl.$sela("th").$loop((th, i) => {
            if (th.classList.contains("hide-on-export"))
                return "continue";

            columns.push(i)

            if (i === 0) {
                columnWidth.push("5%")
                return
            }

            columnWidth.push("*")
        })

        new $.fn.dataTable.Buttons(tableInstance, {
            buttons: [
                {
                    extend: 'copyHtml5',
                    title: documentTitle,
                    exportOptions: {
                        columns: columns
                    }
                },
                {
                    extend: 'excelHtml5',
                    title: documentTitle,
                    exportOptions: {
                        columns: columns
                    }
                },
                {
                    extend: 'csvHtml5',
                    title: documentTitle,
                    exportOptions: {
                        columns: columns
                    }
                },
                {
                    extend: 'pdfHtml5',
                    title: documentTitle,
                    exportOptions: {
                        columns: columns
                    },
                    customize: (doc) => {
                        //Remove the title created by dataTables
                        doc.content.splice(0, 1);

                        //Create a date string that we use in the footer. Format is dd-mm-yyyy
                        const now = new Date();
                        const jsDate = now.getDate() + '-' + (now.getMonth() + 1) + '-' + now.getFullYear();
                        let logo = "";

                        (async () => {
                            logo = await $img2blob($id("temp-dtable-img-holder"))
                        })();

                        doc.pageMargins = [20, 60, 20, 30];

                        // Set the font size fot the entire document
                        doc.defaultStyle.fontSize = 8;

                        // Set the fontsize for the table header
                        doc.styles.tableHeader.fontSize = 8;
                        doc.content[0].table.widths = columnWidth;

                        // Create a header object with 3 columns
                        // Left side: Logo
                        // Middle: brandname
                        // Right side: A document title
                        doc['header'] = (function () {
                            return {
                                columns: [
                                    {
                                        image: logo,
                                        width: 24
                                    },
                                    {
                                        alignment: 'left',
                                        bold: true,
                                        text: $lay.page.html.$sel("[name='author']").content,
                                        fontSize: 17,
                                        margin: [5, 0]
                                    },
                                    {
                                        alignment: 'right',
                                        fontSize: 14,
                                        text: documentTitle
                                    }
                                ],
                                margin: 20
                            }
                        });

                        // Create a footer object with 2 columns
                        // Left side: report creation date
                        // Right side: current page and total pages
                        doc['footer'] = (function (page, pages) {
                            return {
                                columns: [
                                    {
                                        alignment: 'left',
                                        text: ['Created on: ', {text: jsDate.toString()}]
                                    },
                                    {
                                        alignment: 'right',
                                        text: ['page ', {text: page.toString()}, ' of ', {text: pages.toString()}]
                                    }
                                ],
                                margin: 20
                            }
                        });

                        // Change dataTable layout (Table styling)
                        // To use predefined layouts uncomment the line below and comment the custom lines below
                        // doc.content[0].layout = 'lightHorizontalLines'; // noBorders , headerLineOnly
                        const objLayout = {};
                        objLayout['width'] = function (i) {
                            return 800;
                        };
                        objLayout['hLineWidth'] = function (i) {
                            return .5;
                        };
                        objLayout['vLineWidth'] = function (i) {
                            return .5;
                        };
                        objLayout['hLineColor'] = function (i) {
                            return '#53c3bd';
                        };
                        objLayout['vLineColor'] = function (i) {
                            return '#53c3bd';
                        };
                        objLayout['paddingLeft'] = function (i) {
                            return 4;
                        };
                        objLayout['paddingRight'] = function (i) {
                            return 4;
                        };
                        doc.content[0].layout = objLayout;
                    }
                },
                'colvis'
            ]
        }).container().appendTo($('#kt_datatable_example_buttons'));

        // Hook dropdown menu click event to datatable export buttons
        $sela('#kt_datatable_example_export_menu [data-kt-export]').$loop(exportButton => {
            exportButton.$on('click', e => {
                e.preventDefault();

                // Get clicked export value
                const exportValue = e.target.getAttribute('data-kt-export');
                const target = $sel('.dt-buttons .buttons-' + exportValue);

                // Trigger click event on hidden datatable export buttons
                target.click();
            });
        });
    }

    function handleFilterTable(columnIndex, columnOptions) {
        const filterStatus = $sel('[data-kt-user-table-filter]');

        if (!filterStatus)
            return;

        $html(filterStatus, "beforeend", columnOptions)

        $(filterStatus).on('change', e => {
            let value = e.target.value;

            if (value === 'all') {
                value = '';
            }
            tableInstance.column(columnIndex).search(value).draw();
        });
    }

    function handleSearchDatatable() {
        tableEl.closest(".table-wrap-container").$sel('[data-kt-user-table-search="search"]').$on(
            'input',
            (e, field) => tableInstance.search(field.value).draw(),
        )
    }

    function checkBoxes() {
        if (!tableEl.$sel('.entry-checkbox'))
            return;

        const selectAll = tableEl.$sel('.datatable-check-select-all')
        const selectAllCache = tableEl.$sel('.datatable-check-select-all-cache')
        let selectedBoxes = []

        tableEl
            .$sela('.entry-checkbox')
            .$loop(check => {
                $on(check, "change", e => {
                    toggleToolbars(e.target, selectedBoxes)
                    selectAllCache.value = JSON.stringify(selectedBoxes)
                })
            })

        selectAll.$on('change', () => {
            selectedBoxes = []

            tableEl.$sela('tbody .entry-checkbox').$loop(box => {
                box.checked = selectAll.checked

                if (box.checked)
                    selectedBoxes.push(box.value)
            })

            selectAllCache.value = JSON.stringify(selectedBoxes)
        });
    }

    function toggleToolbars(trigger, selectAllCache) {
        // Define variables
        const toolbarBase = tableEl.$sel('[data-kt-docs-table-toolbar="base"]');
        const toolbarSelected = tableEl.$sel('[data-kt-docs-table-toolbar="selected"]');
        const selectedCount = tableEl.$sel('[data-kt-docs-table-select="selected_count"]');

        // Select refreshed checkbox DOM elements
        const allCheckboxes = tableEl.$sela('tbody .entry-checkbox');

        // Detect checkboxes state & count
        let checkedState = false;
        let count = 0;
        let affectAll = $data(trigger, 'check-type') === "central"

        // Count checked boxes
        allCheckboxes.forEach(c => {
            if (affectAll)
                c.checked = trigger.checked

            if (c.checked) {
                checkedState = true;
                count++;
            }
        });

        tableEl.$sel('.entry-checkbox').checked = allCheckboxes.length === count;

        // Toggle toolbars
        if (checkedState) {
            selectedCount.innerHTML = count;
            $class(toolbarBase, 'add', 'd-none')
            $class(toolbarSelected, 'del', 'd-none')
            return;
        }

        $class(toolbarBase, 'del', 'd-none')
        $class(toolbarSelected, 'add', 'd-none')
    }

    function handleDateRange(){
        const dateRange = tableEl.$sel(".datatable-date-picker");

        if (!dateRange)
            return;

        let minDate = null;
        let maxDate = null;

        // Datatable date filter --- more info: https://datatables.net/extensions/datetime/examples/integration/datatables.html
        // Custom filtering function which will search data in column four between two values
        $.fn.dataTable.ext.search.push(
            function (settings, data, dataIndex) {
                let min = minDate;
                let max = maxDate;
                let date = new Date(moment(data[dateRange.dataset.column], dateRange.dataset.format));

                return (min === null && max === null) ||
                    (min === null && date <= max) ||
                    (min <= date && max === null) ||
                    (min <= date && date <= max);
            }
        );

        const datePicker = $(dateRange).flatpickr({
            altInput: true,
            altFormat: "d/m/Y",
            dateFormat: "Y-m-d",
            mode: "range",
            onChange: function (selectedDates, dateStr, instance) {
                minDate = selectedDates[0] ? new Date(selectedDates[0]) : null;
                maxDate = selectedDates[1] ? new Date(selectedDates[1]) : null;

                tableInstance.draw();
            },
        });

        $on(tableEl.$sel('.datatable-date-clear'), "click", e => {
            e.preventDefault()
            datePicker.clear();
        });
    }

    function searchOnServer(){
        const searchBar = tableEl.$sel("input.search-table[type=search]");

        if (!searchBar)
            return

        searchBar.name = "search"
        searchBar.required = true

        $on(searchBar, "keyup", e => {
            if (searchTableFn && (e.key === "Enter" || e.keyCode === 13)) {
                let value = searchBar.value
                destroyTable()
                searchTableFn(encodeURIComponent(value))
            }
        })
    }

    return tableInstance;
}

function dataTableAction(actionsObject = {}) {
    actionsObject.then = KTMenu.createInstances // make dropdown work
    $lay.fn.rowEntryAction(actionsObject)
}

function dataTableDropdown({id, name, menu}) {
    name = !name ? "" : encodeURIComponent(name);
    const link = (menu) => {
        const separator = menu.separator ? `<div class="separator mb-3 opacity-75"></div>` : ""

        if (!menu.name)
            return separator;

        const href = menu.href ?? "javascript:void(0);";
        const target = menu.target ? `target="${menu.target}"` : "";
        const useAction = menu.act ? "table-action" : "";

        let item = `<a href="${href}" ${target} class="${menu.wrap ? '' : 'menu-link'} px-3 ${useAction} ${menu.className ?? ''}" data-id="${id}" data-name="${name}" data-action="${menu.act}">${menu.name}</a>`
        item = menu.wrap ? `<div class="menu-content px-3 py-3" style="text-align: center">${item}</div>` : item;

        return `<div class="menu-item px-3">${item}</div>${separator}`;
    };

    let menus = "";

    $loop(menu, m => {
        let subMenu = "";
        if ($type(m) === "Array") {
            $loop(m.submenu, sub => subMenu += link(sub))
            menus += (
                `<div class="menu-item px-3" data-kt-menu-trigger="hover" data-kt-menu-placement="right-start">
                        <a href="#" class="menu-link px-3">
                            <span class="menu-title">${m.name}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="menu-sub menu-sub-dropdown w-175px py-4">
                            ${subMenu}
                        </div>
                    </div>`
            );

            return "continue";
        }

        menus += link(m)
    });

    return (
        `<div class="card-toolbar">
                
            <button type="button" class="btn btn-icon btn-color-gray-400 btn-active-color-primary justify-content-end" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                <i class="ki-outline ki-dots-square fs-1 text-gray-400 me-n1"></i>
            </button>
            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold w-auto min-w-200 mw-300px" data-kt-menu="true">
                <!--begin::Menu item-->
                <div class="menu-item px-3">
                    <div class="menu-content fs-6 text-dark fw-bold px-3 py-4 text-center">Actions</div>
                </div>
                
                ${menus}
            </div>
        </div>`
    )
}