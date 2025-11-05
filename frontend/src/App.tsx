import { AppShell, Burger, Group, Anchor, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DocsPage } from './pages/Docs';
import { MonitorPage } from './pages/Monitor';
import { FlowsPage } from './pages/Flows';

function NavigationLinks() {
  const location = useLocation();
  const links = [
    { to: '/docs', label: 'Docs' },
    { to: '/monitor', label: 'Monitor' },
    { to: '/flows', label: 'Flows' },
  ];

  return (
    <Group gap="md">
      {links.map((link) => (
        <Anchor
          component={Link}
          key={link.to}
          to={link.to}
          c={location.pathname === link.to ? 'cyan.4' : 'gray.2'}
        >
          {link.label}
        </Anchor>
      ))}
    </Group>
  );
}

function Shell() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={600}>Notion Proxy Console</Text>
          </Group>
          <Group visibleFrom="sm">
            <NavigationLinks />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <NavigationLinks />
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/flows" element={<FlowsPage />} />
          <Route path="*" element={<DocsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

const App = () => (
  <BrowserRouter>
    <Shell />
  </BrowserRouter>
);

export default App;
