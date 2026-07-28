(() => {
  const zones = document.querySelectorAll('[data-upload-zone]');

  zones.forEach((zone) => {
    const input = zone.querySelector('[data-file-input]');
    const dropzone = zone.querySelector('.cms-dropzone');
    const previewList = zone.querySelector('[data-preview-list]');
    if (!input || !dropzone || !previewList) return;

    const openPicker = () => input.click();

    const assignFiles = (files) => {
      if (!files.length) return;
      const transfer = new DataTransfer();
      Array.from(files).forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
      renderPreviews(input.files, previewList);
    };

    dropzone.addEventListener('click', openPicker);
    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPicker();
      }
    });

    input.addEventListener('change', () => renderPreviews(input.files, previewList));

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add('is-dragging');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, () => {
        dropzone.classList.remove('is-dragging');
      });
    });

    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      assignFiles(event.dataTransfer.files);
    });
  });

  function renderPreviews(files, previewList) {
    const existingItems = previewList.querySelectorAll('.existing');
    previewList.innerHTML = '';
    existingItems.forEach((item) => previewList.appendChild(item));

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const figure = document.createElement('figure');
        figure.className = 'cms-preview-card pending';
        figure.innerHTML = `
          <img src="${URL.createObjectURL(file)}" alt="">
          <figcaption>${file.name}</figcaption>
        `;
        previewList.appendChild(figure);
        return;
      }

      const chip = document.createElement('div');
      chip.className = 'cms-file-chip pending';
      chip.innerHTML = '<i class="fas fa-file-lines"></i>';
      const name = document.createElement('span');
      name.textContent = file.name;
      chip.appendChild(name);
      previewList.appendChild(chip);
    });
  }

  // --- PREMIUM DATA TABLE ENHANCER ---
  const PER_PAGE_STORAGE_KEY = 'cms-admin-items-per-page';
  const VALID_PER_PAGE = [5, 10, 20, 50];

  function getStoredPerPage() {
    try {
      const stored = parseInt(localStorage.getItem(PER_PAGE_STORAGE_KEY), 10);
      return VALID_PER_PAGE.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  function storePerPage(value) {
    try {
      localStorage.setItem(PER_PAGE_STORAGE_KEY, String(value));
    } catch {
      // Ignore storage failures (private browsing, quota, etc.)
    }
  }

  const tableWraps = document.querySelectorAll('.cms-table-wrap');

  tableWraps.forEach((wrap) => {
    const table = wrap.querySelector('.cms-table');
    if (!table) return;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    const originalRows = Array.from(tbody.querySelectorAll('tr'));
    if (originalRows.length === 0) return;

    // 0. Configuration flags from data attributes
    const selectable = wrap.dataset.selectable !== 'false';
    const searchable = wrap.dataset.searchable !== 'false';
    const columnsToggle = wrap.dataset.columnsToggle !== 'false';
    const paginated = wrap.dataset.paginated !== 'false';
    const perPageSelector = wrap.dataset.perPageSelector !== 'false';
    const sortable = wrap.dataset.sortable !== 'false';

    const colIndexOffset = selectable ? 1 : 0;

    // 1. Prepare Columns & Headers
    const headers = Array.from(thead.querySelectorAll('tr th'));
    const isActionColumn = (th) => th.classList.contains('cms-table-actions') || th.classList.contains('cms-drag-col') || th.textContent.trim() === '';

    // Add checkbox column header if selectable is true
    if (selectable) {
      const checkboxTh = document.createElement('th');
      checkboxTh.className = 'cms-checkbox-cell';
      checkboxTh.innerHTML = `
        <label class="cms-checkbox-wrapper">
          <input type="checkbox" class="cms-checkbox cms-master-checkbox" aria-label="Select all rows">
        </label>
      `;
      thead.querySelector('tr').insertBefore(checkboxTh, thead.querySelector('tr').firstChild);
    }

    // Make headers sortable if sortable is true
    headers.forEach((th, index) => {
      if (isActionColumn(th)) return;
      const colIdx = index + colIndexOffset;
      if (sortable) {
        th.classList.add('cms-sortable-header');
        const text = th.textContent.trim();
        th.innerHTML = `${text}<i class="fas fa-chevron-down cms-sort-icon"></i>`;
        th.dataset.colIndex = colIdx;
        th.dataset.sortDir = 'none';
      }
    });

    // 2. Prepare Rows & Data
    const allRowsData = originalRows.map((tr) => {
      // Add checkbox cell to row if selectable is true
      if (selectable) {
        const checkboxTd = document.createElement('td');
        checkboxTd.className = 'cms-checkbox-cell';
        checkboxTd.innerHTML = `
          <label class="cms-checkbox-wrapper">
            <input type="checkbox" class="cms-checkbox cms-row-checkbox" aria-label="Select row">
          </label>
        `;
        tr.insertBefore(checkboxTd, tr.firstChild);
      }

      // Enhance text badges dynamically (Website, Source, No logo)
      const cells = Array.from(tr.querySelectorAll('td'));
      cells.forEach((td, index) => {
        // Skip checkbox cell if selectable is true, drag cell, and actions cell
        if ((selectable && index === 0) || td.classList.contains('cms-drag-cell') || index === cells.length - 1) return;

        // Beautify deployed links / source links
        if (td.textContent.includes('Website') || td.textContent.includes('Source')) {
          let html = '';
          if (td.textContent.includes('Website')) {
            html += `<span class="cms-badge success"><i class="fas fa-globe"></i> Website</span> `;
          }
          if (td.textContent.includes('Source')) {
            html += `<span class="cms-badge info"><i class="fab fa-github"></i> Source</span>`;
          }
          td.innerHTML = html || td.innerHTML;
        }

        // Beautify 'No logo'
        if (td.textContent.trim() === 'No logo') {
          td.innerHTML = `<span class="cms-badge secondary">No logo</span>`;
        }
      });

      // Prepare search strings
      const searchableTexts = cells.map(td => td.textContent.trim().toLowerCase());
      
      return {
        element: tr,
        cellsTexts: searchableTexts,
        checkbox: selectable ? tr.querySelector('.cms-row-checkbox') : null
      };
    });

    // 3. Create Toolbar directly inside the panel (above the wrap)
    let toolbar = null;
    if (searchable || columnsToggle || (selectable && allRowsData.length > 0)) {
      toolbar = document.createElement('div');
      toolbar.className = 'cms-table-toolbar';
      toolbar.innerHTML = `
        <div class="cms-table-toolbar-left">
          ${selectable ? '<span class="cms-badge secondary cms-selected-count-badge" style="display:none;">0 selected</span>' : ''}
        </div>
        <div class="cms-table-toolbar-right">
          ${searchable ? `
            <div class="cms-table-search">
              <i class="fas fa-search search-icon"></i>
              <input type="text" placeholder="Search..." class="cms-search-input" aria-label="Search table">
            </div>
          ` : ''}
          ${columnsToggle ? `
            <div class="cms-table-column-toggle">
              <button class="cms-icon-button cms-column-toggle-btn" title="Toggle Columns" type="button">
                <i class="fas fa-columns"></i>
              </button>
              <div class="cms-column-menu hidden"></div>
            </div>
          ` : ''}
        </div>
      `;
      wrap.parentNode.insertBefore(toolbar, wrap);
    }

    // 4. Create Footer directly inside the panel (below the wrap)
    let footer = null;
    if (paginated) {
      footer = document.createElement('div');
      footer.className = 'cms-table-footer';
      footer.innerHTML = `
        <div class="cms-table-info">
          Showing <span class="cms-range-start">0</span> to <span class="cms-range-end">0</span> of <span class="cms-total-rows">0</span> results
        </div>
        <div class="cms-table-pagination-controls">
          ${perPageSelector ? `
            <div class="cms-per-page">
              <span class="cms-per-page-label">Per page</span>
              <div class="cms-per-page-dropdown">
                <button type="button" class="cms-per-page-trigger" aria-label="Rows per page" aria-haspopup="listbox" aria-expanded="false">
                  <span class="cms-per-page-value">10</span>
                  <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </button>
                <div class="cms-per-page-menu hidden" role="listbox" aria-label="Rows per page">
                  <button type="button" class="cms-per-page-option" role="option" data-value="5">5</button>
                  <button type="button" class="cms-per-page-option active" role="option" data-value="10" aria-selected="true">10</button>
                  <button type="button" class="cms-per-page-option" role="option" data-value="20">20</button>
                  <button type="button" class="cms-per-page-option" role="option" data-value="50">50</button>
                </div>
              </div>
            </div>
          ` : ''}
          <div class="cms-pagination-pages"></div>
        </div>
      `;
      wrap.parentNode.insertBefore(footer, wrap.nextSibling);
    }

    // Elements references
    const searchInput = toolbar ? toolbar.querySelector('.cms-search-input') : null;
    const masterCheckbox = selectable ? wrap.querySelector('.cms-master-checkbox') : null;
    const columnToggleBtn = toolbar ? toolbar.querySelector('.cms-column-toggle-btn') : null;
    const columnMenu = toolbar ? toolbar.querySelector('.cms-column-menu') : null;
    const perPageDropdown = footer ? footer.querySelector('.cms-per-page-dropdown') : null;
    const perPageTrigger = footer ? footer.querySelector('.cms-per-page-trigger') : null;
    const perPageValue = footer ? footer.querySelector('.cms-per-page-value') : null;
    const perPageMenu = footer ? footer.querySelector('.cms-per-page-menu') : null;
    const perPageOptions = footer ? Array.from(footer.querySelectorAll('.cms-per-page-option')) : [];
    const paginationPages = footer ? footer.querySelector('.cms-pagination-pages') : null;
    const rangeStartSpan = footer ? footer.querySelector('.cms-range-start') : null;
    const rangeEndSpan = footer ? footer.querySelector('.cms-range-end') : null;
    const totalRowsSpan = footer ? footer.querySelector('.cms-total-rows') : null;
    const selectedCountBadge = toolbar ? toolbar.querySelector('.cms-selected-count-badge') : null;

    // State
    let filteredRows = [...allRowsData];
    let currentPage = 1;
    let itemsPerPage = getStoredPerPage() ?? 10;

    function syncPerPageUI(value) {
      if (perPageValue) {
        perPageValue.textContent = String(value);
      }
      perPageOptions.forEach((option) => {
        const isActive = parseInt(option.dataset.value, 10) === value;
        option.classList.toggle('active', isActive);
        option.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    if (perPageSelector) {
      syncPerPageUI(itemsPerPage);
    }

    // 5. Column Visibility Dropdown Setup
    if (columnsToggle && columnMenu) {
      const allHeaders = Array.from(thead.querySelectorAll('tr th'));
      const columnMenuContent = allHeaders
        .map((th, index) => {
          if ((selectable && index === 0) || isActionColumn(th)) return ''; // skip checkbox and actions
          const labelText = th.textContent.trim();
          return `
            <label>
              <input type="checkbox" checked data-col-index="${index}" class="cms-checkbox" style="width: 14px; height: 14px;">
              <span>${labelText}</span>
            </label>
          `;
        })
        .join('');
      columnMenu.innerHTML = `
        <button type="button" class="cms-column-menu-toggle-all">Deselect all</button>
        ${columnMenuContent}
      `;
      const columnToggleAllBtn = columnMenu.querySelector('.cms-column-menu-toggle-all');
      const columnCheckboxes = Array.from(columnMenu.querySelectorAll('input[type="checkbox"]'));

      function setColumnVisibility(colIdx, visible) {
        // Toggle header
        thead.querySelectorAll('tr').forEach((tr) => {
          const cell = tr.children[colIdx];
          if (cell) {
            cell.style.display = visible ? '' : 'none';
          }
        });

        // Toggle rows
        tbody.querySelectorAll('tr').forEach((tr) => {
          const cell = tr.children[colIdx];
          if (cell) {
            cell.style.display = visible ? '' : 'none';
          }
        });
      }

      function updateColumnToggleAllText() {
        const allChecked = columnCheckboxes.length > 0 && columnCheckboxes.every((checkbox) => checkbox.checked);
        columnToggleAllBtn.textContent = allChecked ? 'Deselect all' : 'Select all';
      }

      columnToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        columnMenu.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!columnMenu.classList.contains('hidden') && !columnMenu.contains(e.target) && e.target !== columnToggleBtn) {
          columnMenu.classList.add('hidden');
        }
      });

      columnToggleAllBtn.addEventListener('click', () => {
        const shouldSelectAll = columnCheckboxes.some((checkbox) => !checkbox.checked);
        columnCheckboxes.forEach((checkbox) => {
          checkbox.checked = shouldSelectAll;
          setColumnVisibility(parseInt(checkbox.dataset.colIndex, 10), shouldSelectAll);
        });
        updateColumnToggleAllText();
      });

      columnCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => {
          const colIdx = parseInt(e.target.dataset.colIndex, 10);
          setColumnVisibility(colIdx, e.target.checked);
          updateColumnToggleAllText();
        });
      });

      updateColumnToggleAllText();
    }

    // 6. Master checkbox toggle (only if selectable is true)
    if (selectable && masterCheckbox) {
      masterCheckbox.addEventListener('change', () => {
        const isChecked = masterCheckbox.checked;
        const activeRowsOnPage = getActivePageRows();
        activeRowsOnPage.forEach((rowData) => {
          if (rowData.checkbox) {
            rowData.checkbox.checked = isChecked;
          }
        });
        updateSelectedCountBadge();
      });

      // Add change listeners to each row checkbox to update master/badge
      allRowsData.forEach((rowData) => {
        if (rowData.checkbox) {
          rowData.checkbox.addEventListener('change', () => {
            updateMasterCheckboxState();
            updateSelectedCountBadge();
          });
        }
      });
    }

    function getActivePageRows() {
      if (!paginated) return filteredRows;
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredRows.slice(start, end);
    }

    function updateMasterCheckboxState() {
      if (!selectable || !masterCheckbox) return;
      const activeRowsOnPage = getActivePageRows();
      if (activeRowsOnPage.length === 0) {
        masterCheckbox.checked = false;
        masterCheckbox.indeterminate = false;
        return;
      }
      const checkedCount = activeRowsOnPage.filter(r => r.checkbox && r.checkbox.checked).length;
      masterCheckbox.checked = checkedCount === activeRowsOnPage.length;
      masterCheckbox.indeterminate = checkedCount > 0 && checkedCount < activeRowsOnPage.length;
    }

    function updateSelectedCountBadge() {
      if (!selectable || !selectedCountBadge) return;
      const totalChecked = allRowsData.filter(r => r.checkbox && r.checkbox.checked).length;
      if (totalChecked > 0) {
        selectedCountBadge.textContent = `${totalChecked} selected`;
        selectedCountBadge.style.display = '';
      } else {
        selectedCountBadge.style.display = 'none';
      }
    }

    // 7. Sorting implementation (only if sortable is true)
    if (sortable) {
      thead.addEventListener('click', (e) => {
        const header = e.target.closest('.cms-sortable-header');
        if (!header) return;

        const colIndex = parseInt(header.dataset.colIndex, 10);
        const currentDir = header.dataset.sortDir;
        let newDir = 'asc';

        if (currentDir === 'asc') {
          newDir = 'desc';
        } else if (currentDir === 'desc') {
          newDir = 'none';
        }

        // Reset other headers
        thead.querySelectorAll('.cms-sortable-header').forEach((th) => {
          if (th !== header) {
            th.dataset.sortDir = 'none';
            th.classList.remove('asc', 'desc');
          }
        });

        header.dataset.sortDir = newDir;
        header.classList.remove('asc', 'desc');
        if (newDir !== 'none') {
          header.classList.add(newDir);
        }

        // Perform sort
        if (newDir === 'none') {
          // Restore original order
          filteredRows = [...allRowsData];
          // Re-apply current search if any
          if (searchInput) applySearch(searchInput.value);
        } else {
          filteredRows.sort((a, b) => {
            // Read cells
            const valA = a.element.children[colIndex].textContent.trim();
            const valB = b.element.children[colIndex].textContent.trim();

            // Check if numeric sort is appropriate
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
              return newDir === 'asc' ? numA - numB : numB - numA;
            }

            // Fallback to text sort
            return newDir === 'asc' 
              ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
              : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
          });
        }

        currentPage = 1;
        renderTable();
      });
    }

    // 8. Searching implementation (only if searchable is true)
    function applySearch(query) {
      const cleanedQuery = query.toLowerCase().trim();
      if (!cleanedQuery) {
        filteredRows = [...allRowsData];
      } else {
        filteredRows = allRowsData.filter((rowData) => {
          // Check if query is in any of the visible columns texts
          return rowData.cellsTexts.some((text, idx) => {
            if ((selectable && idx === 0) || idx === rowData.cellsTexts.length - 1) return false;
            return text.includes(cleanedQuery);
          });
        });
      }
    }

    if (searchable && searchInput) {
      searchInput.addEventListener('input', () => {
        applySearch(searchInput.value);
        currentPage = 1;
        renderTable();
      });
    }

    // 9. Per Page selection (custom dropdown)
    function closePerPageMenu() {
      if (!perPageDropdown || !perPageMenu || !perPageTrigger) return;
      perPageDropdown.classList.remove('is-open');
      perPageMenu.classList.add('hidden');
      perPageTrigger.setAttribute('aria-expanded', 'false');
    }

    function setPerPage(value) {
      if (!VALID_PER_PAGE.includes(value)) return;
      itemsPerPage = value;
      syncPerPageUI(value);
      storePerPage(value);
      closePerPageMenu();
      currentPage = 1;
      renderTable();
    }

    if (perPageDropdown && perPageTrigger && perPageMenu) {
      perPageTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !perPageMenu.classList.contains('hidden');
        if (isOpen) {
          closePerPageMenu();
        } else {
          perPageDropdown.classList.add('is-open');
          perPageMenu.classList.remove('hidden');
          perPageTrigger.setAttribute('aria-expanded', 'true');
        }
      });

      perPageOptions.forEach((option) => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          setPerPage(parseInt(option.dataset.value, 10));
        });
      });

      document.addEventListener('click', (e) => {
        if (!perPageMenu.classList.contains('hidden') && !perPageDropdown.contains(e.target)) {
          closePerPageMenu();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closePerPageMenu();
        }
      });
    }

    // 10. Render / Refresh Table View
    function renderTable() {
      // Clear current rows in DOM
      tbody.innerHTML = '';

      const totalItems = filteredRows.length;
      let start = 0;
      let end = totalItems;
      let totalPages = 1;

      if (paginated) {
        totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages) {
          currentPage = totalPages;
        }
        start = (currentPage - 1) * itemsPerPage;
        end = Math.min(start + itemsPerPage, totalItems);
      }

      // Append active rows to tbody
      const pageRows = filteredRows.slice(start, end);
      const columnCheckboxes = columnMenu ? Array.from(columnMenu.querySelectorAll('input[type="checkbox"]')) : [];

      pageRows.forEach((rowData) => {
        // Enforce visibility of columns based on column menu checkboxes
        if (columnsToggle && columnMenu) {
          columnCheckboxes.forEach((cb) => {
            const colIdx = parseInt(cb.dataset.colIndex, 10);
            const cell = rowData.element.children[colIdx];
            if (cell) {
              cell.style.display = cb.checked ? '' : 'none';
            }
          });
        }
        tbody.appendChild(rowData.element);
      });

      // Show no rows message if empty
      if (totalItems === 0) {
        const emptyTr = document.createElement('tr');
        const totalCols = thead.querySelectorAll('tr th').length;
        emptyTr.innerHTML = `
          <td colspan="${totalCols}" style="text-align: center; padding: 3rem; color: #8c857b;">
            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
            <strong>No matching records found</strong>
            <p style="margin-top: 0.25rem; font-size: 0.88rem;">Try adjusting your search term or filters.</p>
          </td>
        `;
        tbody.appendChild(emptyTr);
      }

      // Update Pagination info if paginated
      if (paginated && footer) {
        rangeStartSpan.textContent = totalItems === 0 ? 0 : start + 1;
        rangeEndSpan.textContent = end;
        totalRowsSpan.textContent = totalItems;

        // Render page buttons
        renderPaginationControls(totalPages);
      }

      updateMasterCheckboxState();
      updateSelectedCountBadge();
    }

    function renderPaginationControls(totalPages) {
      if (!paginationPages) return;
      paginationPages.innerHTML = '';

      // Previous button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'cms-page-btn';
      prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
      prevBtn.disabled = currentPage === 1;
      prevBtn.type = 'button';
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
      paginationPages.appendChild(prevBtn);

      // Page numbers (smart rendering - up to 5 buttons, with active page highlighted)
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }

      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `cms-page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.type = 'button';
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          renderTable();
        });
        paginationPages.appendChild(pageBtn);
      }

      // Next button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'cms-page-btn';
      nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.type = 'button';
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable();
        }
      });
      paginationPages.appendChild(nextBtn);
    }

    // Initial render
    renderTable();

    if (wrap.dataset.reorderable === 'true' && wrap.dataset.reorderUrl) {
      initRowReorder(wrap, tbody, wrap.dataset.reorderUrl);
    }
  });

  function initRowReorder(wrap, tbody, reorderUrl) {
    let draggedRow = null;
    let dragSourceHandle = null;

    function getOrderedIds() {
      return Array.from(tbody.querySelectorAll('tr[data-row-id]'))
        .map((row) => Number(row.dataset.rowId))
        .filter((id) => Number.isFinite(id) && id > 0);
    }

    function clearDropIndicators() {
      tbody.querySelectorAll('tr.is-drop-target').forEach((row) => row.classList.remove('is-drop-target'));
    }

    async function persistOrder() {
      const ids = getOrderedIds();
      if (!ids.length) return;

      wrap.classList.add('is-saving-order');
      try {
        const response = await fetch(reorderUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (!response.ok) throw new Error('Failed to save order');
        wrap.classList.add('order-saved');
        window.setTimeout(() => wrap.classList.remove('order-saved'), 1200);
      } catch {
        wrap.classList.add('order-save-error');
        window.setTimeout(() => wrap.classList.remove('order-save-error'), 2200);
      } finally {
        wrap.classList.remove('is-saving-order');
      }
    }

    tbody.addEventListener('dragstart', (event) => {
      const handle = event.target.closest('.cms-drag-handle');
      if (!handle) return;

      draggedRow = handle.closest('tr[data-row-id]');
      dragSourceHandle = handle;
      if (!draggedRow) return;

      draggedRow.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedRow.dataset.rowId || '');
    });

    tbody.addEventListener('dragend', () => {
      if (draggedRow) draggedRow.classList.remove('is-dragging');
      draggedRow = null;
      dragSourceHandle = null;
      clearDropIndicators();
    });

    tbody.addEventListener('dragover', (event) => {
      if (!draggedRow) return;
      event.preventDefault();

      const targetRow = event.target.closest('tr[data-row-id]');
      clearDropIndicators();
      if (!targetRow || targetRow === draggedRow) return;

      targetRow.classList.add('is-drop-target');
      const targetRect = targetRow.getBoundingClientRect();
      const insertBefore = event.clientY < targetRect.top + targetRect.height / 2;

      if (insertBefore) {
        tbody.insertBefore(draggedRow, targetRow);
      } else {
        tbody.insertBefore(draggedRow, targetRow.nextElementSibling);
      }
    });

    tbody.addEventListener('drop', (event) => {
      event.preventDefault();
      clearDropIndicators();
      if (!draggedRow) return;
      persistOrder();
    });

    tbody.querySelectorAll('.cms-drag-handle').forEach((handle) => {
      handle.addEventListener('mousedown', (event) => event.stopPropagation());
      handle.addEventListener('click', (event) => event.preventDefault());
    });
  }
})();
