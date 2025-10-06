import { useState } from 'react';
import { Paper, Text, Stack, Grid, Title, Button, Group, Badge, Table, ScrollArea, Tabs, Alert, Progress, SegmentedControl, Tooltip } from '@mantine/core';
import { IconDownload, IconAlertTriangle, IconTrendingUp, IconTrendingDown, IconEqual, IconFileAnalytics } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { CompareResult } from '../types/index';

interface CompareResultsProps {
  result: CompareResult;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDelta(delta: number): { text: string; color: string; icon: React.ReactNode } {
  if (delta === 0) {
    return { text: '0', color: 'gray', icon: <IconEqual size={14} /> };
  }
  const sign = delta > 0 ? '+' : '';
  return {
    text: `${sign}${formatBytes(delta)}`,
    color: delta > 0 ? 'red' : 'green',
    icon: delta > 0 ? <IconTrendingUp size={14} /> : <IconTrendingDown size={14} />,
  };
}

export function CompareResults({ result }: CompareResultsProps) {
  const [viewMode, setViewMode] = useState<'sections' | 'files'>('sections');

  const exportToCSV = (type: 'all' | 'increases' | 'decreases' | 'anomalies') => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'all':
        data = result.sections;
        filename = 'comparison-all-sections';
        break;
      case 'increases':
        data = result.topIncreases;
        filename = 'comparison-top-increases';
        break;
      case 'decreases':
        data = result.topDecreases;
        filename = 'comparison-top-decreases';
        break;
      case 'anomalies':
        data = result.anomalies;
        filename = 'comparison-anomalies';
        break;
    }

    const headers = type === 'anomalies'
      ? ['Type', 'Name', 'Severity', 'Delta (Bytes)', 'Reasons']
      : ['Section', 'File', 'Size A', 'Size B', 'Delta (Bytes)', 'Delta (%)', 'Status'];

    const rows = data.map(item => {
      if (type === 'anomalies') {
        return [
          item.type,
          item.name,
          item.severity,
          item.delta,
          item.reasons.join('; '),
        ];
      } else {
        return [
          item.name,
          item.file || '',
          item.sizeA,
          item.sizeB,
          item.delta,
          item.deltaPct.toFixed(2),
          item.status,
        ];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportFullReport = () => {
    const report = {
      compareId: result.compareId,
      summary: result.summary,
      topIncreases: result.topIncreases,
      topDecreases: result.topDecreases,
      anomalies: result.anomalies,
      metadata: result.metadata,
    };

    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparison-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Prepare comparison chart data - top 10 by absolute delta
  const topChanges = [...result.sections]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 10);

  const comparisonChartData = topChanges.map(section => ({
    name: section.name.length > 20 ? section.name.substring(0, 18) + '...' : section.name,
    fullName: section.name,
    'Build A': section.sizeA,
    'Build B': section.sizeB,
    delta: section.delta,
    deltaPct: section.deltaPct,
  }));

  // Prepare delta-only chart (increases vs decreases)
  const deltaChartData = [
    ...result.topIncreases.slice(0, 10).map(s => ({
      name: s.name.length > 25 ? s.name.substring(0, 23) + '...' : s.name,
      fullName: s.name,
      delta: s.delta,
      type: 'increase',
    })),
    ...result.topDecreases.slice(0, 10).map(s => ({
      name: s.name.length > 25 ? s.name.substring(0, 23) + '...' : s.name,
      fullName: s.name,
      delta: Math.abs(s.delta),
      type: 'decrease',
    })),
  ];

  return (
    <Stack gap="md">
      {/* Summary Cards */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600} size="sm">FLASH Memory</Text>
                <Badge color={result.summary.flashDelta > 0 ? 'red' : result.summary.flashDelta < 0 ? 'green' : 'gray'}>
                  {formatDelta(result.summary.flashDelta).text} ({result.summary.flashDeltaPct > 0 ? '+' : ''}{result.summary.flashDeltaPct}%)
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">Build A:</Text>
                <Text size="sm" fw={500}>{formatBytes(result.summary.totalFlashA)}</Text>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">Build B:</Text>
                <Text size="sm" fw={500}>{formatBytes(result.summary.totalFlashB)}</Text>
              </Group>
              <Progress
                value={Math.abs(result.summary.flashDeltaPct)}
                color={result.summary.flashDelta > 0 ? 'red' : 'green'}
                size="sm"
                animated
              />
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600} size="sm">RAM Memory</Text>
                <Badge color={result.summary.ramDelta > 0 ? 'red' : result.summary.ramDelta < 0 ? 'green' : 'gray'}>
                  {formatDelta(result.summary.ramDelta).text} ({result.summary.ramDeltaPct > 0 ? '+' : ''}{result.summary.ramDeltaPct}%)
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">Build A:</Text>
                <Text size="sm" fw={500}>{formatBytes(result.summary.totalRamA)}</Text>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">Build B:</Text>
                <Text size="sm" fw={500}>{formatBytes(result.summary.totalRamB)}</Text>
              </Group>
              <Progress
                value={Math.abs(result.summary.ramDeltaPct)}
                color={result.summary.ramDelta > 0 ? 'red' : 'green'}
                size="sm"
                animated
              />
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="md" withBorder style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed" mb="xs">Sections Added</Text>
            <Text size="xl" fw={700} c="blue">{result.summary.sectionsAdded}</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="md" withBorder style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed" mb="xs">Sections Removed</Text>
            <Text size="xl" fw={700} c="orange">{result.summary.sectionsRemoved}</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="md" withBorder style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed" mb="xs">Sections Modified</Text>
            <Text size="xl" fw={700} c="grape">{result.summary.sectionsModified}</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Anomalies Alert */}
      {result.anomalies.length > 0 && (
        <Alert color="yellow" title={`${result.anomalies.length} Anomalies Detected`} icon={<IconAlertTriangle size={20} />}>
          <Stack gap="xs">
            <Text size="sm">
              Detected {result.anomalies.filter(a => a.severity === 'high').length} high severity,{' '}
              {result.anomalies.filter(a => a.severity === 'medium').length} medium severity,{' '}
              and {result.anomalies.filter(a => a.severity === 'low').length} low severity anomalies.
            </Text>
            <Button
              variant="light"
              color="yellow"
              size="xs"
              onClick={() => exportToCSV('anomalies')}
              leftSection={<IconDownload size={14} />}
            >
              Export Anomalies
            </Button>
          </Stack>
        </Alert>
      )}

      {/* Comparison Charts */}
      <Grid gutter="md">
        {/* Build A vs Build B Comparison */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Build A vs Build B (Top 10)</Title>
                <Button
                  variant="light"
                  color="grape"
                  size="xs"
                  onClick={() => exportToCSV('all')}
                  leftSection={<IconDownload size={14} />}
                >
                  Export
                </Button>
              </Group>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonChartData} layout="horizontal" margin={{ bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: 10 }}
                  />
                  <YAxis tickFormatter={formatBytes} style={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(value: any) => formatBytes(value)}
                    labelFormatter={(label: any) => comparisonChartData.find(d => d.name === label)?.fullName || label}
                  />
                  <Legend />
                  <Bar dataKey="Build A" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Build B" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Delta Chart - Increases vs Decreases */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Top Increases & Decreases</Title>
                <Group gap="xs">
                  <Button
                    variant="light"
                    color="red"
                    size="xs"
                    onClick={() => exportToCSV('increases')}
                    leftSection={<IconTrendingUp size={14} />}
                  >
                    Increases
                  </Button>
                  <Button
                    variant="light"
                    color="green"
                    size="xs"
                    onClick={() => exportToCSV('decreases')}
                    leftSection={<IconTrendingDown size={14} />}
                  >
                    Decreases
                  </Button>
                </Group>
              </Group>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={deltaChartData} layout="vertical" margin={{ left: 130 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatBytes} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    style={{ fontSize: 10 }}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => formatBytes(value)}
                    labelFormatter={(label: any) => deltaChartData.find(d => d.name === label)?.fullName || label}
                  />
                  <Legend />
                  <Bar dataKey="delta" name="Size Change" radius={[0, 4, 4, 0]}>
                    {deltaChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === 'increase' ? '#ef4444' : '#22c55e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Detailed Tables */}
      <Paper shadow="sm" p="md" withBorder>
        <Tabs defaultValue="changes" color="grape">
          <Tabs.List>
            <Tabs.Tab value="changes">
              All Changes ({viewMode === 'sections' ? result.sections.length : result.fileGroups.length})
            </Tabs.Tab>
            <Tabs.Tab value="anomalies">
              Anomalies ({result.anomalies.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="changes" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <SegmentedControl
                  value={viewMode}
                  onChange={(val) => setViewMode(val as 'sections' | 'files')}
                  data={[
                    { label: 'By Section', value: 'sections' },
                    { label: 'By File', value: 'files' },
                  ]}
                  color="grape"
                />
                <Button
                  variant="light"
                  size="sm"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => exportToCSV('all')}
                >
                  Export CSV
                </Button>
              </Group>

              <ScrollArea h={400}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{viewMode === 'sections' ? 'Section' : 'File'}</Table.Th>
                      {viewMode === 'sections' && <Table.Th>File</Table.Th>}
                      {viewMode === 'files' && <Table.Th>Sections</Table.Th>}
                      <Table.Th>Size A</Table.Th>
                      <Table.Th>Size B</Table.Th>
                      <Table.Th>Delta</Table.Th>
                      <Table.Th>Delta %</Table.Th>
                      {viewMode === 'sections' && <Table.Th>Status</Table.Th>}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(viewMode === 'sections' ? result.sections : result.fileGroups).map((item: any, idx) => {
                      const deltaInfo = formatDelta(item.delta);
                      return (
                        <Table.Tr key={idx}>
                          <Table.Td>
                            <Text size="sm" ff="monospace">{viewMode === 'sections' ? item.name : item.file}</Text>
                          </Table.Td>
                          {viewMode === 'sections' && (
                            <Table.Td>
                              <Text size="sm" c="dimmed">{item.file || '-'}</Text>
                            </Table.Td>
                          )}
                          {viewMode === 'files' && (
                            <Table.Td>
                              <Badge size="sm" variant="light">{item.sectionCount}</Badge>
                            </Table.Td>
                          )}
                          <Table.Td>
                            <Text size="sm">{formatBytes(item.sizeA)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatBytes(item.sizeB)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              {deltaInfo.icon}
                              <Text size="sm" c={deltaInfo.color} fw={500}>{deltaInfo.text}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c={deltaInfo.color}>{item.deltaPct > 0 ? '+' : ''}{item.deltaPct}%</Text>
                          </Table.Td>
                          {viewMode === 'sections' && (
                            <Table.Td>
                              <Badge
                                size="sm"
                                color={item.status === 'added' ? 'blue' : item.status === 'removed' ? 'orange' : 'gray'}
                              >
                                {item.status}
                              </Badge>
                            </Table.Td>
                          )}
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="anomalies" pt="md">
            <Stack gap="md">
              <ScrollArea h={400}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Severity</Table.Th>
                      <Table.Th>Delta</Table.Th>
                      <Table.Th>Reasons</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {result.anomalies.map((anomaly, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>
                          <Badge size="sm" variant="light">{anomaly.type}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" ff="monospace">{anomaly.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            color={anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'yellow' : 'blue'}
                          >
                            {anomaly.severity}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>{formatDelta(anomaly.delta).text}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={4}>
                            {anomaly.reasons.map((reason, ridx) => (
                              <Text key={ridx} size="xs" c="dimmed">• {reason}</Text>
                            ))}
                          </Stack>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>

      {/* Export Full Report */}
      <Group justify="center">
        <Button
          variant="filled"
          color="grape"
          size="lg"
          leftSection={<IconFileAnalytics size={20} />}
          onClick={exportFullReport}
        >
          Export Full Comparison Report (JSON)
        </Button>
      </Group>

      {/* Metadata */}
      {result.compareId && (
        <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <Group gap="md" justify="space-between">
            <Text size="xs" c="dimmed">Comparison ID: {result.compareId}</Text>
            <Text size="xs" c="dimmed">
              Generated: {new Date(result.metadata.comparedAt).toLocaleString()}
            </Text>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}
