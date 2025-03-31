<?php
function renderNav($activePage) {
    $url = ""; // Replace this with your actual base URL
?>
    <div class="sidebar-container">
        <div class="sidebar">
          <nav id="sidebarMenu">
            <div class="sidebarLogo">
              <img src="https://www.stafify.com/cdn/shop/files/e50lj9u5c9xat9j7z3ne_752x.png?v=1613708232" class="menu-text site-logo" alt="Stafify Logo">
              <img src="https://res.cloudinary.com/dt1vbprub/image/upload/v1741661073/Stafify_Icon_onet8q.jpg" class="site-icon" alt="Stafify Icon">
            </div>
            <ul class="flex flex-col gap-5 sidebarMenuItems">
              <li class="sidebarMenuItem">
                <a href="<?= $url ?>?page=analytics" class="nav-link <?= $activePage === 'analytics' ? 'active' : '' ?>">
                  <span class="menu-text">Analytics</span>
                </a>
              </li>
              <li class="sidebarMenuItem">
                <a href="<?= $url ?>?page=index" class="nav-link <?= $activePage === 'index' ? 'active' : '' ?>">
                  <span class="menu-text">Job Order</span>
                </a>
              </li>
              <li class="sidebarMenuItem">
                <a href="<?= $url ?>?page=inventory" class="nav-link <?= $activePage === 'inventory' ? 'active' : '' ?>">
                  <span class="menu-text">Inventory</span>
                </a>
              </li>
              <li class="sidebarMenuItem">
                <button class="toggle-btn" onclick="toggleSidebar()">
                  <span class="menu-text">Collapse Sidebar</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
    </div>
<?php
}
?>
