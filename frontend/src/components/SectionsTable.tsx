import { useState, useMemo, useEffect } from 'react';
import { Paper, Text, Table, ScrollArea, TextInput, Group, Button, Title, SegmentedControl, Stack, Select, Badge, Tooltip, Highlight, ActionIcon, Affix, Transition } from '@mantine/core';
import { IconSearch, IconDownload, IconFilter, IconArrowUp } from '@tabler/icons-react';
import { useWindowScroll } from '@mantine/hooks';
import Fuse from 'fuse.js';
import type { Section } from '../types/index';
import { aggregateSections } from '../utils/sectionUtils';
import { getSectionColor } from '../utils/colorMapping';
import { Analytics } from '../hooks/useAnalytics';

interface SectionsTableProps {
  sections: Section[];
  selectedSection?: string | null;
  onSectionClick?: (sectionName: string) => void;
  analysisResult?: any;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function SectionsTable({ sections, selectedSection, onSectionClick, analysisResult }: SectionsTableProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'percentage' | 'file' | 'region'>('size');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');
  const [sectionTypeFilter, setSectionTypeFilter] = useState<string | null>(null);
  const [scroll] = useWindowScroll();

  const displaySections = viewMode === 'detailed' ? sections : aggregateSections(sections);
  const totalSize = sections.reduce((sum, section) => sum + section.size, 0);

  const getRegion = (sectionName: string): string => {
    const flashSections = ['.text', '.rodata', '.data', '.init_array', '.fini_array', '.ARM.exidx', '.ARM.extab'];
    const ramSections = ['.bss', '.stack', '.heap'];

    if (flashSections.some(fs => sectionName.startsWith(fs))) return 'FLASH';
    if (ramSections.some(rs => sectionName.startsWith(rs))) return 'RAM';
    if (sectionName.startsWith('.data')) return 'FLASH+RAM';
    return 'Unknown';
  };

  const sectionsWithPercentage = displaySections.map(section => ({
    ...section,
    percentage: totalSize > 0 ? (section.size / totalSize * 100) : 0,
    region: getRegion(section.name),
  }));

  // Extract unique section types (.text, .data, .bss, etc.)
  const sectionTypes = useMemo(() => {
    const types = new Set<string>();
    displaySections.forEach(section => {
      const parts = section.name.split('.');
      if (parts.length >= 2) {
        types.add(parts.slice(0, 2).join('.'));
      }
    });
    return Array.from(types).sort();
  }, [displaySections]);

  // Fuzzy search using Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(sectionsWithPercentage, {
      keys: ['name', 'filePath'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [sectionsWithPercentage]);

  const filteredSections = useMemo(() => {
    let filtered = sectionsWithPercentage;

    // Apply section type filter
    if (sectionTypeFilter) {
      filtered = filtered.filter(section => section.name.startsWith(sectionTypeFilter));
    }

    // Apply search (fuzzy or exact)
    if (search.trim()) {
      const fuseResults = fuse.search(search);
      filtered = fuseResults.map(result => result.item);
    }

    // Sort
    return filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') {
        return multiplier * a.name.localeCompare(b.name);
      }
      if (sortBy === 'file') {
        const fileA = a.filePath || '';
        const fileB = b.filePath || '';
        return multiplier * fileA.localeCompare(fileB);
      }
      if (sortBy === 'region') {
        return multiplier * (a.region || '').localeCompare(b.region || '');
      }
      if (sortBy === 'percentage') {
        return multiplier * (a.percentage - b.percentage);
      }
      return multiplier * (a.size - b.size);
    });
  }, [sectionsWithPercentage, sectionTypeFilter, search, fuse, sortBy, sortOrder]);

  const handleSort = (column: 'name' | 'size' | 'percentage' | 'file' | 'region') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = viewMode === 'detailed'
      ? ['Section Name', 'Region', 'Address', 'Size (Bytes)', 'Size', '% of Total', 'File']
      : ['Section Name', 'Region', 'Size (Bytes)', 'Size', '% of Total', 'Subsections'];

    const rows = filteredSections.map(section =>
      viewMode === 'detailed'
        ? [
            section.name,
            section.region,
            section.address || '',
            section.size,
            formatBytes(section.size),
            section.percentage.toFixed(2) + '%',
            section.filePath || ''
          ]
        : [
            section.name,
            section.region,
            section.size,
            formatBytes(section.size),
            section.percentage.toFixed(2) + '%',
            section.subsections || 1
          ]
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-sections-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    // Track CSV export
    Analytics.trackExport('csv', 'sections');
  };

  const exportToJSON = () => {
    const data = filteredSections.map(section => ({
      name: section.name,
      region: section.region,
      address: section.address,
      sizeBytes: section.size,
      sizeFormatted: formatBytes(section.size),
      percentage: parseFloat(section.percentage.toFixed(2)),
      filePath: section.filePath,
      subsections: section.subsections
    }));

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-sections-${viewMode}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // Track JSON export
    Analytics.trackExport('json', 'sections');
  };

  return (
    <>
      <style>{`
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Paper shadow="sm" p="md" withBorder>
        <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>Memory Sections</Title>
          <Group gap="xs">
            <SegmentedControl
              value={viewMode}
              onChange={(value) => setViewMode(value as 'detailed' | 'summary')}
              data={[
                { label: 'Detailed View', value: 'detailed' },
                { label: 'High-Level Summary', value: 'summary' }
              ]}
              color="grape"
            />
          </Group>
        </Group>

        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <TextInput
              placeholder="Fuzzy search sections or files..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ minWidth: 280 }}
            />
            <Select
              placeholder="Filter by type"
              leftSection={<IconFilter size={16} />}
              value={sectionTypeFilter}
              onChange={setSectionTypeFilter}
              data={[
                { value: '', label: 'All Types' },
                ...sectionTypes.map(type => ({ value: type, label: type }))
              ]}
              clearable
              style={{ minWidth: 150 }}
            />
            {(search || sectionTypeFilter) && (
              <Badge color="grape" variant="light">
                {filteredSections.length} matches
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            <Button
              variant="light"
              color="grape"
              size="sm"
              leftSection={<IconDownload size={16} />}
              onClick={exportToCSV}
            >
              CSV
            </Button>
            <Button
              variant="light"
              color="grape"
              size="sm"
              leftSection={<IconDownload size={16} />}
              onClick={exportToJSON}
            >
              JSON
            </Button>
          </Group>
        </Group>

        <ScrollArea h={500}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Tooltip label="Click to sort by section name">
                  <Table.Th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('name')}
                  >
                    Section Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Table.Th>
                </Tooltip>
                <Tooltip label="Click to sort by region">
                  <Table.Th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('region')}
                  >
                    Region {sortBy === 'region' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Table.Th>
                </Tooltip>
                {viewMode === 'detailed' && (
                  <>
                    <Tooltip label="Memory address">
                      <Table.Th>Address</Table.Th>
                    </Tooltip>
                    <Tooltip label="Click to sort by file">
                      <Table.Th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('file')}
                      >
                        File {sortBy === 'file' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Table.Th>
                    </Tooltip>
                  </>
                )}
                {viewMode === 'summary' && (
                  <Tooltip label="Number of subsections">
                    <Table.Th>Subsections</Table.Th>
                  </Tooltip>
                )}
                <Tooltip label="Click to sort by size">
                  <Table.Th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('size')}
                  >
                    Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Table.Th>
                </Tooltip>
                <Tooltip label="Size in bytes">
                  <Table.Th>Size (Bytes)</Table.Th>
                </Tooltip>
                <Tooltip label="Click to sort by percentage">
                  <Table.Th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('percentage')}
                  >
                    % of Total {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Table.Th>
                </Tooltip>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredSections.map((section, index) => {
                const isSelected = selectedSection === section.name;
                const sectionType = section.name.split('.').slice(0, 2).join('.');
                const sectionColor = getSectionColor(section.name);

                return (
                  <Table.Tr
                    key={`${section.name}-${index}`}
                    onClick={() => onSectionClick?.(section.name)}
                    style={{
                      cursor: onSectionClick ? 'pointer' : 'default',
                      backgroundColor: isSelected ? 'rgba(155, 89, 182, 0.1)' : undefined,
                      transform: isSelected ? 'scale(1.01)' : undefined,
                      transition: 'all 0.2s ease',
                      animation: `fadeInRow 0.3s ease ${index * 20}ms forwards`,
                      opacity: 0,
                    }}
                  >
                    <Table.Td>
                      <Group gap="xs">
                        <Badge
                          size="xs"
                          variant="dot"
                          color={sectionColor}
                          style={{ borderColor: sectionColor }}
                        />
                        <Highlight
                          highlight={search}
                          size="sm"
                          ff="monospace"
                          fw={isSelected ? 600 : 400}
                        >
                          {section.name}
                        </Highlight>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        color={
                          section.region === 'FLASH' ? 'blue' :
                          section.region === 'RAM' ? 'orange' :
                          section.region === 'FLASH+RAM' ? 'grape' :
                          'gray'
                        }
                      >
                        {section.region}
                      </Badge>
                    </Table.Td>
                    {viewMode === 'detailed' && (
                      <>
                        <Table.Td>
                          <Text size="sm" c="dimmed" ff="monospace">{section.address || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Highlight
                            highlight={search}
                            size="sm"
                            c="blue"
                          >
                            {section.filePath || '-'}
                          </Highlight>
                        </Table.Td>
                      </>
                    )}
                    {viewMode === 'summary' && (
                      <Table.Td>
                        <Badge size="sm" variant="light" color="gray">
                          {section.subsections || 1}
                        </Badge>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Text size="sm" fw={500}>{formatBytes(section.size)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{section.size.toLocaleString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="grape" fw={500}>{section.percentage.toFixed(2)}%</Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {filteredSections.length} {viewMode === 'detailed' ? 'sections' : 'section groups'}
            {filteredSections.length !== displaySections.length && ` (filtered from ${displaySections.length})`}
          </Text>
          <Text size="sm" fw={600} c="grape">
            Total: {formatBytes(totalSize)}
          </Text>
        </Group>
      </Stack>
    </Paper>

    {/* Back to top button */}
    <Affix position={{ bottom: 20, right: 20 }}>
      <Transition transition="slide-up" mounted={scroll.y > 300}>
        {(transitionStyles) => (
          <Tooltip label="Back to top">
            <ActionIcon
              size="xl"
              radius="xl"
              variant="filled"
              color="grape"
              style={transitionStyles}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <IconArrowUp size={24} />
            </ActionIcon>
          </Tooltip>
        )}
      </Transition>
    </Affix>
  </>
  );
}
