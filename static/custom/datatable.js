function dataTable({
       selector = 'table.data-table',
       searchTableFn,
       dateRangeObj = {api : "", headers: {}, then: () => null},
       singleFilter,
       multiFilter,
       destroy
   }) {

    if(destroy) {
        if($.fn.DataTable.isDataTable(selector))
            $(selector).DataTable().destroy()

        return;
    }

    const tableEl = $sel(selector).closest(".table-wrap-container")
    const tableID = "#" + tableEl.$sel("table").id;
    let tableHeaders = []

    const tableInstance = $(selector).DataTable({
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
        oLanguage: {
            sInfo: "_START_ - _END_ of _TOTAL_",
            sInfoEmpty: "0 entries",
        },
    })

    tableInstance.columns().header().each((head) => tableHeaders.push(head.innerText.toLowerCase()))

    $sel(tableID).dataset.dtableInit = "true"
    searchOnServer()
    handleDateRange()
    handleFilterTable(singleFilter)
    handleMultiFilterTable(multiFilter)
    handleSearchDatatable()
    exportButtons()
    checkBoxes()

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

    function handleFilterTable(singleFilter) {
        const filterElement = tableEl.$sel('[data-filter-column]');

        if (!filterElement)
            return;

        const columnOptions = singleFilter.options
        const columnIndex = singleFilter.index ?? filterElement.dataset.filterColumn

        filterElement.$html('<option value="__ALL__">All</option>' + columnOptions)

        $(filterElement).on('change', e => {
            let value = e.target.value;

            if (value === '__ALL__')
                value = '';
            else
                value = e.target.options[e.target.selectedIndex].innerText

            tableInstance.column(columnIndex).search(value).draw();
        });
    }

    function handleMultiFilterTable(multiFilter) {

        const filterElement = tableEl.$sel('[data-multi-filter]');

        if (!filterElement)
            return;


        const filterTemplate = (column, options) => {
            let columnIndex = column
            let isColumnIndexSet = false

            if(!isNaN(column)) {
                tableHeaders.$loop((head, i) => {
                    if (i === column)
                        column = head.toUpperCase()
                })

                isColumnIndexSet = true
            }

            const columnLower = column.toLowerCase();
            const columnTag = columnLower.trim().replaceAll(" ", "-");
            const columnName = columnTag.replaceAll("-","_");

            if(isNaN(columnIndex) && !isColumnIndexSet) {
                column = column.toUpperCase()

                tableHeaders.$loop((head, i) => {
                    if (head === columnLower)
                        columnIndex = i
                })
            }

            return {
                columnIndex: columnIndex,
                id: "multi-filter-" + columnTag,
                body: (
                    `<div class="mb-10">
                        <label class="form-label fs-6 fw-semibold">${column}:</label>
                        <select
                            id="multi-filter-${columnTag}" 
                            class="form-select form-select-solid fw-bold" 
                            data-kt-select2="true" 
                            data-placeholder="Select option" 
                            data-allow-clear="true" data-kt-user-table-filter="${columnTag}" 
                            data-hide-search="true"
                            data-column-index="${columnIndex}"
                            name="${columnName}"
                        >
                            <option value="__ALL__">All</option>
                            ${options}
                        </select>
                    </div>`
                )
            }
        }

        const handleResetForm = () => {
            // Select reset button
            const resetButton = filterElement.$sel('[data-kt-user-table-filter="reset"]');

            // Reset datatable
            resetButton.$on('click', function () {
                // Select filter options
                const filterForm = filterElement.$sel('[data-kt-user-table-filter="form"]');
                const selectOptions = filterForm.querySelectorAll('select');

                // Reset select2 values -- more info: https://select2.org/programmatic-control/add-select-clear-items
                selectOptions.forEach(select => $(select).val('__ALL__').trigger('change'));

                // Reset datatable --- official docs reference: https://datatables.net/reference/api/search()
                tableInstance.search('').draw();
            });
        }

        const handleFilterDatatable = () => {
            // Select filter options
            const filterForm = tableEl.$sel('[data-kt-user-table-filter="form"]');
            const filterButton = filterForm.$sel('[data-kt-user-table-filter="filter"]');
            const selectOptions = filterForm.querySelectorAll('select');

            // Filter datatable on submit
            filterButton.addEventListener('click', function () {
                tableInstance.search.fixed("fun", (row, data) => {
                    let condition = true;

                    selectOptions.forEach(item => {
                        const value = item.value.trim()

                        if(value === '' || value === '__ALL__')
                            return;


                        condition = condition && data[item.dataset.columnIndex].includes(item.value)
                    });

                    // data
                    return condition;
                }).draw();
            });
        }

        filterElement.$sel(".multi-filter-body").$html(" ")

        $loop(multiFilter, (options, column) => {
            const data = filterTemplate(column, options)

            filterElement.$sel(".multi-filter-body").$html("beforeend", data.body)
        })

        handleResetForm()
        handleFilterDatatable()
    }

    function handleSearchDatatable() {
        tableEl.closest(".table-wrap-container").$sel('[data-kt-user-table-search="search"]').$on(
            'input',
            (e, field) => {
                $debounce(() => {
                    tableInstance.search(field.value).draw()
                }, 100)
            },
        )
    }

    function checkBoxes() {
        if (!tableEl.$sel("table").dataset.hasCheckbox)
            return;

        const toolbarBase = tableEl.$sel('[data-kt-docs-table-toolbar="base"]');
        const toolbarSelected = tableEl.$sel('[data-kt-docs-table-toolbar="selected"]');
        const selectedCount = tableEl.$sel('[data-kt-docs-table-select="selected_count"]');

        const selectAll = tableEl.$sel('.datatable-check-select-all')
        const selectAllCache = tableEl.$sel('.datatable-check-select-all-cache')

        let selectedBoxes = []

        const saveToCache = () => {
            $debounce(() => {
                selectAllCache.value = JSON.stringify(selectedBoxes)
            }, 700)
        }

        tableEl
            .$sela('.entry-checkbox')
            .$loop(check => {
                $on(check, "change", (e, box) => {
                    toggleToolbars(box)
                    saveToCache()
                })
            })

        selectAll.$on('change', (e, selectAllBtn) => {
            selectedBoxes = []

            tableEl.$sela('tbody .entry-checkbox').$loop(box => {
                box.checked = selectAllBtn.checked

                toggleToolbars(box)
            })

            saveToCache()
        });


        function toggleToolbars(trigger) {
            if (trigger.checked) {
                selectedBoxes.push(trigger.value)
                selectedCount.innerHTML = selectedBoxes.length;

                $class(toolbarBase, 'add', 'd-none')
                $class(toolbarSelected, 'del', 'd-none')

                return;
            }

            selectedBoxes.splice(
                selectedBoxes.indexOf(trigger.value), 1
            )

            if(selectedBoxes.length === 0) {
                $class(toolbarBase, 'del', 'd-none')
                $class(toolbarSelected, 'add', 'd-none')
                return;
            }

            selectedCount.innerHTML = selectedBoxes.length;
        }
    }

    function handleDateRange(){
        const dateRange = tableEl.$sel(".datatable-date-picker");
        let rangeExtSet = false

        if (!dateRange)
            return;

        const datePicker = $(dateRange).flatpickr({
            altInput: true,
            altFormat: "d/m/Y",
            dateFormat: "Y-m-d",
            mode: "range",
            onChange: function (selectedDates) {
                if(!rangeExtSet) {
                    $.fn.dataTable.ext.search.push(
                        function (settings, row, dataIndex) {
                            const date = new Date(moment(row[dateRange.dataset.column], dateRange.dataset.format));

                            if (isNaN(date) && !dateRange.dataset.reported) {
                                dateRange.dataset.reported = "1"
                                datePicker.close()
                                datePicker.clear()

                                return osNote(
                                    `An invalid date was received! Please check your date format and try again.
                            <p class="m-0 p-0">
                                Current Format: <b>${dateRange.dataset.format}</b> <br>
                                Table Date: <b>${row[dateRange.dataset.column]}</b>
                            </p>`,
                                    "warn", {duration: -1}
                                )
                            }

                            const minDate = dateRange.dataset.min === "__" ? null : new Date(dateRange.dataset.min)
                            const maxDate = dateRange.dataset.max === "__" ? null : new Date(dateRange.dataset.max)

                            const isLowerBound = minDate ? minDate <= date : true
                            const isUpperBound = maxDate ? maxDate >= date : true

                            if (
                                (!minDate && !maxDate) ||
                                (isLowerBound && isUpperBound)
                            )
                                return true;

                            if (isLowerBound && !maxDate)
                                return true;

                            if (!minDate && isUpperBound)
                                return true;

                            return false
                        }
                    );

                    rangeExtSet = true
                }

                dateRange.dataset.min = selectedDates[0] ?? "__"
                dateRange.dataset.max = selectedDates[1] ?? "__"

                tableInstance.draw();
            },
        });

        $on(tableEl.$sel('.datatable-date-clear'), "click", e => {
            e.preventDefault()
            datePicker.clear();
            dateRange.dataset.min = "__"
            dateRange.dataset.max = "__"
        });

        $on(tableEl.$sel('.datatable-date-goto-server'), "click", e => {
            e.preventDefault()

            if(datePicker.input.value.trim() === "")
                return osNote("Cannot submit an empty date range", "warn")

            let obj = {
                preload: $preloader,
                data: {
                    range: datePicker.input.value
                },
            }

            if(dateRangeObj.headers)
                obj['headers'] = dateRangeObj.headers

            if(!dateRangeObj.api)
                return osNote("No dateRange api set. Please inspect your code and do the needful", "warn")

            $curl(dateRangeObj.api, obj)
                .finally(() => $preloader("hide"))
                .then(resolve => {
                    if (resolve.length === 0)
                        return osNote("No result found within range")

                    dateRangeObj.then(resolve)
                })
        });
    }

    function searchOnServer(){
        const searchBar = tableEl.$sel("input.search-table[type=search]");

        if (!searchBar)
            return

        $on(searchBar, "keyup", e => {
            if (searchTableFn && (e.key === "Enter" || e.keyCode === 13)) {
                let value = searchBar.value.trim()

                if(value === "")
                    return osNote("Cannot submit an empty search to server")

                tableEl.$sel(".reset-table-entries").$class('del', "d-none")

                searchTableFn(encodeURIComponent(value), {
                    tableInstance: tableInstance,
                    tableContainer: tableEl
                })
            }
        })
    }

    return {
        tableInstance: tableInstance,
        tableContainer: tableEl
    };
}

async function hookTableOnPage({
       api,             form,
       entry,           entryAction,
       entryActionFn,   deleteMsg,
       batch,           enableDelete = true,
       ctrl,            fetchOnLoad = true,
       tableBody = $sel(".entry-table-body"),
   }) {
    const tableContainer = tableBody.closest(".table-wrap-container")
    enableDelete = !api.delete ? false : enableDelete
    const addEntry = tableContainer.$sel(".add-new-entry")

    if(addEntry)
        addNewEntry(addEntry)

    if(batch)
        batchUpload({
            api: ctrl + api.batch,
            csv: batch.csv,
            note: batch.note,
            callback: loadEntries
        })

    function addNewEntry(addNewEntry){
        $on(addNewEntry, "click", e => {
            e.preventDefault()

            osModal({
                head: form.head,
                foot: "",
                closeOnBlur: false,
                size: form.size ?? "lg",
                body: (
                    `<form>
                        ${form.body()}
                        <div class="text-center">
                            ${$facades.submitBtn()}
                        </div>
                    </form>`
                ),
                then: () => {
                    if(form.then)
                        form.then('ADD')

                    $facades.submitBtnEvent((btn) => ajax(
                        btn,
                        () => $curl(ctrl + api.add, {
                            preload: () => preloadBtn(btn),
                            data: btn,
                            headers: {
                                "X-CSRF-TOKEN": getCsrf()
                            }
                        })
                            .finally(() => preloadBtn(btn, false))
                            .then(res => serverResponse(res.code, res.msg, loadEntries, false))
                    ))
                }
            })
        });
    }

    function loadEntries(opts = {closeBox : true, preload : true, redraw: true}) {
        if(opts.closeOnBlur)
            CusWind.closeBox()

        const obj = {
            headers: {
                "X-CSRF-TOKEN": getCsrf()
            }
        }

        if(opts.preload)
            obj.preload = $preloader

        return $curl(ctrl + api.list, obj)
            .finally(() => $preloader("hide"))
            .then(response => tableEntries(response))
    }

    function tableEntries(response) {
        dataTable({
            destroy: true
        })

        if ((response.code && (!response.data || response.data.length === 0)) || response.length === 0) {
            $html(tableBody, "in", (
                `<tr><td colspan="100%" style="text-align: center">No data found!</td></tr>`
            ))
            return
        }

        let output = ""
        let filtersArray = [];
        let multiFiltersArray = {};
        let multiFilters = {};
        let multiFilterColumns = [];
        let filters = "";
        const tableHasCheckbox = tableBody.closest("table").dataset.hasCheckbox
        let useDefaultCheckbox = entry.anchor.checkbox ?? true

        $loop(response, (row, i) => {
            i++;

            if(entry.filter && !entry.multiFilter) {
                const fil = entry.filter(row)
                const filterName = fil.name
                const filterValue = fil.value ?? fil.name

                if (!filtersArray.includes(filterName)) {
                    filtersArray.push(filterName)
                    filters += `<option value="${filterValue}">${filterName}</option>`;
                }
            }

            if(entry.multiFilter) {
                $loop(entry.multiFilter(row), (fill, col) => {
                    const filterName = fill.name
                    const filterValue = fill.value ?? fill.name

                    if (!multiFilterColumns.includes(col))
                        multiFilterColumns.push(col)

                    if(!multiFiltersArray[col]) {
                        multiFiltersArray[col] = []
                        multiFilters[col] = "";
                    }

                    if (!multiFiltersArray[col].includes(filterName)) {
                        multiFiltersArray[col].push(filterName)
                        multiFilters[col] += `<option value="${filterValue}">${filterName}</option>`;
                    }
                })
            }


            entry.anchor = entry.anchor ?? {}
            entry.anchor.actions = entry.anchor.actions ?? []
            const entryAnchorActions = (
                entry.anchor.actions.length === 0 && $type(entry.anchor.actionsFn)  === "Function" ?
                    entry.anchor.actionsFn({id: row[entry.anchor.id], info: row})
                    : entry.anchor.actions
            )

            let rowDataset = ""

            if(entry.rowDataset)
                $loop(entry.rowDataset(row, i), (data, name) => rowDataset += `data-${name}="${data}" `)

            let checkboxRow = "";

            if(tableHasCheckbox) {
                checkboxRow += useDefaultCheckbox ? `<td>
                    <div 
                        class="form-check form-check-sm form-check-custom form-check-solid"
                    >
                        <input class="form-check-input entry-checkbox" type="checkbox" value="${row[entry.anchor.id]}">
                    </div>
                </td>` : ""
            }

            output += (
                `<tr ${rowDataset}>
                    ${checkboxRow}
                    
                    ${entry.row(row, i)}
                    
                    ${ !entry.anchor?.id ? '' :
                    
                    `<td class="text-end">
                        ${$lay.fn.rowEntrySave(row)}
                              
                        ${dataTableDropdown({
                            id: row[entry.anchor.id],
                            name: row[entry.anchor.name],
                            menu: [
                                entry.anchor.edit === false ? '' : ( entry.anchor.edit ? entry.anchor.edit({id: row[entry.anchor.id]}) :
                                        {
                                            name: "Edit Item",
                                            act: "edit",
                                        }
                                ),
    
                                ...entryAnchorActions,
    
                                (
                                    entry.anchor.delete || enableDelete 
                                        ? {separator: true} : {}
                                ),
    
                                (
                                    entry.anchor.delete === false ? {} : (
                                        enableDelete ? {
                                            name: "Delete Item",
                                            act: "delete",
                                            wrap: true,
                                            className: "btn btn-danger btn-sm"
                                        } : (
                                            enableDelete === false ? {}
                                                : entry.anchor.delete({id: row[entry.anchor.id], info: row})
                                        )
                                    )
                                ),
                            ],
                        })}
                    </td>`
                }
                </tr>`
            );
        });

        $html(tableBody, "in", output)

        if(entry.then)
            entry.then()

        const tableObj = {};

        if(entry.filter) {
            tableObj.singleFilter = {
                column: entry.filter.index,
                options: filters,
            }
            tableObj.filterColumnIndex = entry.filter.index
            tableObj.filterColumnOptions = filters
        }

        if(entry.multiFilter)
            tableObj.multiFilter = multiFilters

        if(entry.search)
            tableObj.searchTableFn = (value, dTable) => {
                entry.search(value, {
                    populateTable: (res) => tableEntries(res),
                    loadEntries: (opts) => loadEntries(opts),
                })

                dTable.tableContainer.$sel(".reset-table-entries").$on('click', (e, btn) => {
                    e.preventDefault()

                    loadEntries().then(() => {
                        btn.$class('add', 'd-none')
                        dTable.tableContainer.$sel('.search-table').value = ""
                        dTable.tableInstance.search('').draw();
                    })
                })
            }

        if(api.dateRange)
            tableObj.dateRangeObj = {
                api: ctrl + api.dateRange,
                headers: {
                    "X-CSRF-TOKEN": getCsrf()
                },
                then: (res) => tableEntries(res)
            }

        dataTable(tableObj)
        entriesAction()
    }

    function entriesAction(){
        let opts = {
            edit: ({info, name, id}) => {
                osModal({
                    head: "Edit " + name,
                    foot: "",
                    closeOnBlur: false,
                    size: "lg",
                    body: (
                        `<form>
                            ${form.body(info)}
                            <div class="text-center">
                                <input type="hidden" name="id" value="${id}">
                                <div class="text-center">${$facades.submitBtn()}</div>
                            </div>
                        </form>`
                    ),
                    then: () => {
                        if(form.then)
                            form.then('EDIT')

                        $on($sel(".submit-form"), "click", (e, btn) => {
                            e.preventDefault()
                            ajax(
                                btn,
                                () => $curl(ctrl + api.edit, {
                                    preload: () => preloadBtn(btn),
                                    data: btn,
                                    headers: {
                                        "X-CSRF-TOKEN": getCsrf()
                                    }
                                })
                                    .finally(() => preloadBtn(btn, false))
                                    .then(res => serverResponse(res.code, res.msg, loadEntries, false))
                            )
                        })
                    }
                })
            },
            delete: ({name, id}) => {
                if(!enableDelete)
                    return;

                Swal.fire({
                    html: !deleteMsg ? "Are you sure you want to delete: <b>" + name + "</b>?" : deleteMsg(name),
                    icon: "warning",
                    buttonsStyling: false,
                    confirmButtonText: "Yeah, do it!",
                    cancelButtonText: "Cancel",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                })
                    .then((res) => {
                        if (res.isConfirmed)
                            $curl(ctrl + api.delete, {
                                preload: $preloader,
                                data: {
                                    id: id,
                                },
                                headers: {
                                    "X-CSRF-TOKEN": getCsrf()
                                }
                            })
                                .finally(() => $preloader("hide"))
                                .then(res => {
                                    let type = "warn"

                                    if (res.code === 1) {
                                        type = "success"
                                        loadEntries()
                                    }

                                    osNote(res.msg, type)
                                })
                    })
            },
        }
        entryAction = entryActionFn ? entryActionFn({loadEntries: loadEntries, populateTable: tableEntries }) : entryAction

        $loop(entryAction, (action, key) => {
            opts[key] = (opt) => {
                opt.closure = loadEntries
                action(opt)
            }
        })

        dataTableAction(opts)
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
            item = menu.wrap ? `<div class="menu-content px-3 pt-0" style="text-align: center">${item}</div>` : item;

            return `<div class="menu-item px-3">${item}</div>${separator}`;
        };

        let menus = "";

        $loop(menu, m => {
            let subMenu = "";

            if ($type(m) === "Array") {

                $loop(m.submenu, sub => subMenu += link(sub))

                menus += (
                    `<div class="menu-item px-3 text-start" data-kt-menu-trigger="hover" data-kt-menu-placement="right-start">
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
            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold w-auto" data-kt-menu="true">
                <!--begin::Menu item-->
                <div class="menu-item px-3">
                    <div class="menu-content fs-6 fw-bold px-3 py-4 text-center">Actions</div>
                </div>
                
                ${menus}
            </div>
        </div>`
        )
    }

    function batchUpload({csv, note, api, callback}){
        $on($sel(".add-in-batch"), "click", e => {
            e.preventDefault()
            osModal({
                head: "Batch Upload",
                foot: "",
                closeOnBlur: false,
                size: "lg",
                body: (
                    `<form>
                    <p class="d-flex align-items-center g-2 flex-wrap">
                        Download the 
                        <a href="${csvLocation + csv}" class="fw-bold text-gray-800 text-hover-primary d-inline-flex align-items-center mx-2" download>
                            <span class="icon-wrapper">
                                <i class="ki-outline ki-file fs-2x text-primary me-1"></i>
                            </span>
                            template CSV file
                        </a>
                        modify and upload below.
                    </p>
                    <h5 class="text-warning-emphasis">${note}</h5>
                    <div class="mb-3 p-3">
                        ${callDropFile({id: "batch-upload-csv", maxFileSize: 1})}
                    </div>
                </form>`
                ),
                then: () => {
                    initDropzone({
                        api: api,
                        id: "batch-upload-csv",
                        fileTypes: "text/csv",
                        uploadFn: (file, drop, bar) => {
                            const data = new FormData()
                            data.append("file", file)
                            let width = 0

                            $curl(api, {
                                data: data,
                                type: "file",
                                headers: {
                                    "X-CSRF-TOKEN": getCsrf()
                                },
                                progress: (e) => {
                                    width = Math.floor((e.loaded/e.total) * 100)
                                    bar.style.width = width + '%';
                                }
                            })
                                .then(res => {
                                    if (res.code === 1 && width >= 100) {
                                        drop.emit("success", file);
                                        drop.emit("complete", file);
                                    }
                                    serverResponse(res.code, res.msg, callback, false, false)
                                })
                        }
                    })
                }
            })
        });
    }

    if(fetchOnLoad)
        return loadEntries()
}

function initDropzone ({api, id = "drag-drop-place", maxFileSize = 1, fileTypes, uploadFn, parallelUploads = 10, onQueueComplete}) {
    id = "#" + id;
    // set the dropzone container id
    const dropzone = document.querySelector(id);

    // set the preview element template
    const previewNode = dropzone.querySelector(".dropzone-item");
    previewNode.id = "";

    const previewTemplate = previewNode.parentNode.innerHTML;
    previewNode.parentNode.removeChild(previewNode);

    const myDropzone = new Dropzone(id, { // Make the whole body a dropzone
        url: api, // Set the url for your upload script location
        parallelUploads: parallelUploads,
        previewTemplate: previewTemplate,
        maxFilesize: maxFileSize, // Max filesize in MB
        acceptedFiles: fileTypes,
        autoProcessQueue: false, // Stop auto upload
        autoQueue: false, // Make sure the files aren't queued until manually added
        previewsContainer: id + " .dropzone-items", // Define the container to display the previews
        clickable: id + " .dropzone-select" // Define the element that should be used as click trigger to select files.
    });

    myDropzone.on("addedfile", function (file) {
        // Hook each start button
        file.previewElement.querySelector(id + " .dropzone-start").onclick = function () {
            const progressBar = file.previewElement.querySelector('.progress-bar');
            progressBar.style.opacity = "1";
            uploadFn(file, myDropzone, progressBar)
        };

        const dropzoneItems = dropzone.querySelectorAll('.dropzone-item');
        dropzoneItems.forEach(dropzoneItem => {
            dropzoneItem.style.display = '';
        });
        dropzone.querySelector('.dropzone-select').classList.remove("drop-zone-custom");
        dropzone.querySelector('.dropzone-select').classList.add("btn", "btn-sm", "btn-primary");
        dropzone.querySelector('.dropzone-upload').style.display = "inline-block";
        dropzone.querySelector('.dropzone-remove-all').style.display = "inline-block";
    });

    // Hide the total progress bar when nothing's uploading anymore
    myDropzone.on("complete", function (file) {
        const progressBars = dropzone.querySelectorAll('.dz-complete');
        setTimeout(function () {
            progressBars.forEach(progressBar => {
                progressBar.querySelector('.progress-bar').style.opacity = "0";
                progressBar.querySelector('.progress').style.opacity = "0";
                progressBar.querySelector('.dropzone-start').style.opacity = "0";
            });
        }, 300);
    });

    // Setup the buttons for all transfers
    dropzone.querySelector(".dropzone-upload").addEventListener('click', function () {
        myDropzone.files.forEach(file => {
            const progressBar = file.previewElement.querySelector('.progress-bar');
            progressBar.style.opacity = "1";
            uploadFn(file, myDropzone, progressBar)
        });
    });

    // Setup the button for remove all files
    dropzone.querySelector(".dropzone-remove-all").addEventListener('click', function () {
        Swal.fire({
            text: "Are you sure you would like to remove all files?",
            icon: "warning",
            showCancelButton: true,
            buttonsStyling: false,
            confirmButtonText: "Yes, remove it!",
            cancelButtonText: "No, return",
            customClass: {
                confirmButton: "btn btn-primary",
                cancelButton: "btn btn-active-light",
                // lift Swal above omjs default modal
                container: "osai-dialogbox__appear",
            }
        }).then(function (result) {
            if (result.value) {
                dropzone.querySelector('.dropzone-upload').style.display = "none";
                dropzone.querySelector('.dropzone-remove-all').style.display = "none";
                myDropzone.removeAllFiles(true);
            } else if (result.dismiss === 'cancel') {
                Swal.fire({
                    text: "Your files was not removed!.",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok, got it!",
                    customClass: {
                        confirmButton: "btn btn-primary",
                        // lift Swal above omjs default modal
                        container: "osai-dialogbox__appear",
                    }
                });
            }
        });
    });

    // On all files completed upload
    myDropzone.on("queuecomplete", function (progress) {
        const uploadIcons = dropzone.querySelectorAll('.dropzone-upload');
        uploadIcons.forEach(uploadIcon => uploadIcon.style.display = "none");
        onQueueComplete(myDropzone, progress)
    });

    // On all files removed
    myDropzone.on("removedfile", function (file) {
        if (myDropzone.files.length < 1) {
            dropzone.querySelector('.dropzone-select').classList.add("drop-zone-custom");
            dropzone.querySelector('.dropzone-select').classList.remove("btn", "btn-sm", "btn-primary");
            dropzone.querySelector('.dropzone-upload').style.display = "none";
            dropzone.querySelector('.dropzone-remove-all').style.display = "none";
        }
    });
}

function callDropFile({id = "drag-drop-place", maxFileSize = 1 }){
    return (
        `<style>
            .drop-zone-custom {
                width: 100%;
                height: 300px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                background: transparent;
                color: var(--bs-body-color);
                font-weight: bold;
                font-size: 2.5rem;
                transition: ease all .8s;
            }
            .drop-zone-custom:hover {
                transition: ease all .8s;
                background: var(--bs-gray-dark);
                color: var(--bs-light);
            }
        </style>
        <div class="dropzone dropzone-queue mb-2" id="${id}">
            <div class="dropzone-panel mb-4">
                <a class="dropzone-select dz-button me-2 dz-clickable drop-zone-custom">Click to add files</a>
                <a class="dropzone-upload btn btn-sm btn-light-primary me-2">Upload All</a>
                <a class="dropzone-remove-all btn btn-sm btn-light-primary">Remove All</a>
                
                <div class="dropzone-items wm-200px">
                    <div class="dropzone-item p-5" style="display:none">
                        <div class="dropzone-file">
                            <div class="dropzone-filename" title="some_image_file_name.jpg">
                                <span data-dz-name="">some_image_file_name.jpg</span>
                                <strong>(
                                    <span data-dz-size="">340kb</span>)</strong>
                            </div>
                            <div class="dropzone-error mt-0" data-dz-errormessage=""></div>
                        </div>
                        
                        <div class="dropzone-progress">
                            <div class="progress bg-gray-300">
                                <div class="progress-bar bg-primary" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-dz-uploadprogress=""></div>
                            </div>
                        </div>
                        
                        <div class="dropzone-toolbar">
                            <span class="dropzone-start">
                                <i class="ki-outline ki-to-right fs-1"></i>
                            </span>
                            <span class="dropzone-cancel" data-dz-remove="" style="display: none;">
                                <i class="ki-outline ki-cross fs-2"></i>
                            </span>
                            <span class="dropzone-delete" data-dz-remove="">
                                <i class="ki-outline ki-cross fs-2"></i>
                            </span>
                        </div>
                    </div>
                    <div class="form-text text-center fs-6 text-muted mt-3">Max file size is ${maxFileSize}MB per file.</div>
                </div>
            </div>
        </div>`
    )
}
