function dataTable({
   selector = 'table.data-table',
   tableInstance,
   destroy,
   searchTableFn,
   dateRangeObj = {api : "", headers: {}, then: () => null},
   filterColumnIndex,
   filterColumnOptions
}) {
    const tableEl = $sel(selector).closest(".table-wrap-container")

    if (destroy)
        return destroyTable()

    if (!$in($sel(".no-results-found"), tableEl))
        tableInstance = $(selector).DataTable({
            destroy: true,
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
        // Custom filtering function which will search data in the specified column between two values
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
                // if(minDate && maxDate)
                    tableInstance.draw();
            },
        });

        $on(tableEl.$sel('.datatable-date-clear'), "click", e => {
            e.preventDefault()
            datePicker.clear();
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

        searchBar.name = "search"
        searchBar.required = true

        $on(searchBar, "keyup", e => {
            if (searchTableFn && (e.key === "Enter" || e.keyCode === 13)) {
                let value = searchBar.value
                searchTableFn(encodeURIComponent(value))
            }
        })
    }

    return tableInstance;
}

async function hookTableOnPage({
   api,             form,
   entry,           entryAction,
   entryActionFn,   deleteMsg,
   batch,           enableDelete = true,
   ctrl,
   tableBody = $sel(".entry-table-body"),
}) {
    let tableInstance
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

    function loadEntries(opts = {closeBox : true, preload : true}) {
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
        if ((response.code && (!response.data || response.data.length === 0)) || response.length === 0) {
            $html(tableBody, "in", (
                `<tr><td colspan="100%" style="text-align: center">No data found!</td></tr>`
            ))
            return
        }

        let output = ""
        let filtersArray = [];
        let filters = "";

        if(entry.filter)
            tableContainer.$sel('[data-kt-user-table-filter]').options.forEach(opt => filtersArray.push(opt.value))

        $loop(response, (row, i) => {
            i++;

            if(entry.filter) {
                const filterName = row[entry.filter.name]
                const filterValue = row[entry.filter.value]

                if (!filtersArray.includes(filterName)) {
                    filtersArray.push(filterName)
                    filters += `<option value="${filterValue}">${filterName}</option>`;
                }
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

            output += (
                `<tr ${rowDataset}>
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

                            {separator: true},

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

        const tableObj = !entry.filter ? {} :
            {
                filterColumnOptions: filters,
                filterColumnIndex: entry.filter.index,
            }

        if(api.dateRange)
            tableObj.dateRangeObj = {
                api: ctrl + api.dateRange,
                headers: {
                    "X-CSRF-TOKEN": getCsrf()
                },
                then: tableEntries
            }

        tableInstance = dataTable(tableObj)
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
                    html: deleteMsg(name),
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
        entryAction = entryActionFn ? entryActionFn({loadEntries: loadEntries, }) : entryAction

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
            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold mw-150px" data-kt-menu="true">
                <!--begin::Menu item-->
                <div class="menu-item px-3">
                    <div class="menu-content fs-6 text-dark fw-bold px-3 py-4 text-center">Actions</div>
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
                    <p class="d-flex align-items-center g-2 flex-wrap text-dark">
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
                dropzone.querySelector('.dropzone-upload').style.display = "none";
                dropzone.querySelector('.dropzone-remove-all').style.display = "none";
            }
        });
    }

    function callDropFile({id = "drag-drop-place", maxFileSize = 1 }){
        return (
            `<div class="form-group">
                <div class="dropzone dropzone-queue mb-2" id="${id}">
                    <div class="dropzone-panel mb-4">
                        <a class="dropzone-select btn btn-sm btn-primary me-2 dz-clickable">Attach files</a>
                        <a class="dropzone-upload btn btn-sm btn-light-primary me-2">Upload All</a>
                        <a class="dropzone-remove-all btn btn-sm btn-light-primary">Remove All</a>
                    </div>
            
                    <div class="dropzone-items wm-200px">
                        <div class="dropzone-item p-5" style="display:none">
                            <div class="dropzone-file">
                                <div class="dropzone-filename text-dark" title="some_image_file_name.jpg">
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
                    </div>
            
                    <div class="dz-default dz-message">
                        <button class="dz-button" type="button">Drop files here to upload</button>
                    </div>
                </div>
            
                <span class="form-text fs-6 text-muted">Max file size is ${maxFileSize}MB per file.</span>
            </div>`
        )
    }

    return loadEntries()
}