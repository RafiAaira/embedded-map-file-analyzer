import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Stack, Grid, Title, Text, FileButton, Button, Group, Badge, NumberInput, LoadingOverlay, Alert, Table, ScrollArea, TextInput, Select, Switch } from '@mantine/core';
import { IconUpload, IconFileText, IconArrowsShuffle, IconCheck, IconX, IconAlertTriangle, IconSearch, IconFilter, IconDownload, IconTrendingUp, IconTrendingDown, IconEqual, IconPlus, IconMinus } from '@tabler/icons-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DiffResult } from '../types/index';
import { Analytics } from '../hooks/useAnalytics';

interface AdvancedCompareProps {
  onDiffComplete: (result: DiffResult) => void;
  diffResult: DiffResult | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'added': return <IconPlus size={16} color="#9b59b6" />;
    case 'removed': return <IconMinus size={16} color="#000" />;
    case 'growth': return <IconTrendingUp size={16} color="#e74c3c" />;
    case 'shrink': return <IconTrendingDown size={16} color="#27ae60" />;
    default: return <IconEqual size={16} color="#95a5a6" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'added': return 'grape';
    case 'removed': return 'dark';
    case 'growth': return 'red';
    case 'shrink': return 'green';
    default: return 'gray';
  }
}

function getStatusBgColor(status: string, theme: 'light' | 'dark') {
  const base = theme === 'dark' ? 'rgba' : 'rgba';
  switch (status) {
    case 'added': return `${base}(155, 89, 182, 0.1)`;
    case 'removed': return `${base}(52, 73, 94, 0.1)`;
    case 'growth': return `${base}(231, 76, 60, 0.1)`;
    case 'shrink': return `${base}(39, 174, 96, 0.1)`;
    default: return 'transparent';
  }
}

export function AdvancedCompare({ onDiffComplete, diffResult: externalDiffResult }: AdvancedCompareProps) {
  const navigate = useNavigate();
  const [fileV1, setFileV1] = useState<File | null>(null);
  const [fileV2, setFileV2] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Use external diffResult from props
  const diffResult = externalDiffResult;

  // Options
  const [growthThreshold, setGrowthThreshold] = useState(10);
  const [shrinkThreshold, setShrinkThreshold] = useState(10);

  // Filtering
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  const handleCompare = async () => {
    if (!fileV1 || !fileV2) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('fileV1', fileV1);
    formData.append('fileV2', fileV2);

    try {
      const params = new URLSearchParams({
        growthThreshold: growthThreshold.toString(),
        shrinkThreshold: shrinkThreshold.toString(),
      });

      const response = await fetch(`http://localhost:5000/diff?${params}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to compute diff');
      }

      const data = await response.json();
      onDiffComplete(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!diffResult) return;

    const headers = ['Section', 'File', 'v1 Size (KB)', 'v2 Size (KB)', 'Δ (KB)', 'Δ %', 'Status', 'Region'];
    const rows = filteredDiff.map(d => [
      d.name,
      d.filePath || '',
      formatBytes(d.sizeV1),
      formatBytes(d.sizeV2),
      formatBytes(d.sizeDiff),
      d.sizeDiffPct.toFixed(2) + '%',
      d.status,
      d.region,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-diff-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Track CSV export
    Analytics.trackExport('csv', 'comparison');
  };

  const exportToJSON = () => {
    if (!diffResult) return;

    const json = JSON.stringify(diffResult, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-diff-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Track JSON export
    Analytics.trackExport('json', 'comparison');
  };

  const exportToPDF = () => {
    if (!diffResult) return;

    // Track PDF export
    Analytics.trackExport('pdf', 'comparison');

    // Navigate to report page with diffResult in state
    navigate('/comparison-report', { state: { diffResult } });
  };

  // Filter diff results
  const filteredDiff = diffResult?.diff.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
        !(d.filePath || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter && d.status !== statusFilter) {
      return false;
    }
    if (anomalyOnly && !diffResult.anomalies.find(a => a.name === d.name)) {
      return false;
    }
    return true;
  }) || [];

  // Compute chart data
  const memoryOverviewData = diffResult ? [
    {
      region: 'FLASH',
      'Version 1': diffResult.diff.filter(d => d.region === 'FLASH').reduce((sum, d) => sum + d.sizeV1, 0),
      'Version 2': diffResult.diff.filter(d => d.region === 'FLASH').reduce((sum, d) => sum + d.sizeV2, 0),
      delta: diffResult.diff.filter(d => d.region === 'FLASH').reduce((sum, d) => sum + d.sizeDiff, 0),
    },
    {
      region: 'RAM',
      'Version 1': diffResult.diff.filter(d => d.region === 'RAM').reduce((sum, d) => sum + d.sizeV1, 0),
      'Version 2': diffResult.diff.filter(d => d.region === 'RAM').reduce((sum, d) => sum + d.sizeV2, 0),
      delta: diffResult.diff.filter(d => d.region === 'RAM').reduce((sum, d) => sum + d.sizeDiff, 0),
    },
  ] : [];

  // Top increases and decreases
  const topChanges = diffResult ? [
    ...diffResult.diff
      .filter(d => d.sizeDiff > 0)
      .sort((a, b) => b.sizeDiff - a.sizeDiff)
      .slice(0, 5)
      .map(d => ({ ...d, type: 'increase' })),
    ...diffResult.diff
      .filter(d => d.sizeDiff < 0)
      .sort((a, b) => a.sizeDiff - b.sizeDiff)
      .slice(0, 5)
      .map(d => ({ ...d, type: 'decrease' })),
  ].sort((a, b) => Math.abs(b.sizeDiff) - Math.abs(a.sizeDiff)).slice(0, 10) : [];

  // Section-level changes - with v1 and v2 values
  const sectionChangesData = diffResult ?
    diffResult.diff
      .filter(d => d.sizeDiff !== 0) // Only sections that changed
      .sort((a, b) => Math.abs(b.sizeDiff) - Math.abs(a.sizeDiff))
      .slice(0, 15) // Top 15 changed sections
      .map(d => ({
        name: d.name.length > 20 ? d.name.substring(0, 18) + '...' : d.name,
        fullName: d.name,
        'Version 1': d.sizeV1,
        'Version 2': d.sizeV2,
        delta: d.sizeDiff,
        region: d.region,
      }))
    : [];

  return (
    <Stack gap="md">
      {/* File Upload */}
      <Paper shadow="sm" p="xl" withBorder pos="relative">
        <LoadingOverlay visible={loading} />

        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Title order={3} mb={4}>Compare Builds</Title>
              <Text size="sm" c="dimmed">Upload two .map files to analyze memory changes and detect anomalies</Text>
            </div>
            <IconArrowsShuffle size={32} stroke={1.5} color="var(--mantine-color-grape-6)" />
          </Group>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600} size="sm">Version 1 (Baseline)</Text>
                    <IconFileText size={20} color="var(--mantine-color-blue-6)" />
                  </Group>
                  <FileButton onChange={setFileV1} accept=".map">
                    {(props) => (
                      <Button {...props} leftSection={<IconUpload size={16} />} variant="light" color="blue" fullWidth>
                        {fileV1 ? 'Change File' : 'Select File v1'}
                      </Button>
                    )}
                  </FileButton>
                  {fileV1 && (
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={500} style={{ flex: 1 }} truncate>{fileV1.name}</Text>
                      <Badge size="sm" variant="light" color="blue">
                        {formatBytes(fileV1.size)}
                      </Badge>
                    </Group>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600} size="sm">Version 2 (New)</Text>
                    <IconFileText size={20} color="var(--mantine-color-green-6)" />
                  </Group>
                  <FileButton onChange={setFileV2} accept=".map">
                    {(props) => (
                      <Button {...props} leftSection={<IconUpload size={16} />} variant="light" color="green" fullWidth>
                        {fileV2 ? 'Change File' : 'Select File v2'}
                      </Button>
                    )}
                  </FileButton>
                  {fileV2 && (
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={500} style={{ flex: 1 }} truncate>{fileV2.name}</Text>
                      <Badge size="sm" variant="light" color="green">
                        {formatBytes(fileV2.size)}
                      </Badge>
                    </Group>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Options */}
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Text fw={600} size="sm">Anomaly Detection Thresholds</Text>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Growth Threshold (%)"
                    description="Flag sections growing by more than this %"
                    value={growthThreshold}
                    onChange={(val) => setGrowthThreshold(Number(val) || 10)}
                    min={1}
                    max={100}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Shrink Threshold (%)"
                    description="Flag sections shrinking by more than this %"
                    value={shrinkThreshold}
                    onChange={(val) => setShrinkThreshold(Number(val) || 10)}
                    min={1}
                    max={100}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>

          <Button
            onClick={handleCompare}
            disabled={!fileV1 || !fileV2 || loading}
            color="grape"
            size="lg"
            leftSection={success ? <IconCheck size={20} /> : <IconArrowsShuffle size={20} />}
            fullWidth
          >
            {success ? 'Comparison Complete' : 'Compare Builds'}
          </Button>

          {error && (
            <Alert color="red" title="Error" icon={<IconX size={16} />}>{error}</Alert>
          )}
          {success && (
            <Alert color="green" title="Success" icon={<IconCheck size={16} />}>Build comparison completed successfully! View results below.</Alert>
          )}
        </Stack>
      </Paper>

      {/* Results */}
      {diffResult && (
        <>
          {/* Export PDF Button */}
          <Group justify="flex-end" mb="md">
            <Button
              variant="filled"
              color="grape"
              leftSection={<IconDownload size={16} />}
              onClick={exportToPDF}
            >
              View Full Report (PDF)
            </Button>
          </Group>

          {/* Summary Cards */}
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="md" withBorder style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" mb="xs">Total Size Change</Text>
                <Text size="xl" fw={700} c={diffResult.summary.totalSizeDiff > 0 ? 'red' : diffResult.summary.totalSizeDiff < 0 ? 'green' : 'gray'}>
                  {diffResult.summary.totalSizeDiff > 0 ? '+' : ''}{formatBytes(diffResult.summary.totalSizeDiff)}
                </Text>
                <Text size="xs" c="dimmed">({diffResult.summary.totalSizeDiffPct > 0 ? '+' : ''}{diffResult.summary.totalSizeDiffPct.toFixed(2)}%)</Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="md" withBorder style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" mb="xs">Sections Changed</Text>
                <Text size="xl" fw={700} c="grape">
                  {diffResult.summary.sectionsGrowth + diffResult.summary.sectionsShrink}
                </Text>
                <Group gap={4} justify="center" mt="xs">
                  <Badge size="sm" color="red">{diffResult.summary.sectionsGrowth} ↑</Badge>
                  <Badge size="sm" color="green">{diffResult.summary.sectionsShrink} ↓</Badge>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="md" withBorder style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" mb="xs">New / Removed</Text>
                <Group gap={8} justify="center">
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xl" fw={700} c="grape">{diffResult.summary.sectionsAdded}</Text>
                    <Text size="xs" c="dimmed">Added</Text>
                  </div>
                  <Text size="xl" c="dimmed">/</Text>
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xl" fw={700}>{diffResult.summary.sectionsRemoved}</Text>
                    <Text size="xs" c="dimmed">Removed</Text>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="md" withBorder style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" mb="xs">Anomalies Detected</Text>
                <Text size="xl" fw={700} c="yellow">{diffResult.anomalies.length}</Text>
                {diffResult.anomalies.length > 0 && (
                  <Text size="xs" c="dimmed">
                    {diffResult.anomalies.filter(a => a.severity === 'critical').length} critical,{' '}
                    {diffResult.anomalies.filter(a => a.severity === 'high').length} high
                  </Text>
                )}
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Anomaly Alert */}
          {diffResult.anomalies.length > 0 && (
            <Alert color="yellow" title={`⚠️ ${diffResult.anomalies.length} Anomalies Detected`} icon={<IconAlertTriangle size={20} />}>
              <Stack gap="xs">
                <Text size="sm">
                  Severity breakdown: {diffResult.anomalies.filter(a => a.severity === 'critical').length} critical,{' '}
                  {diffResult.anomalies.filter(a => a.severity === 'high').length} high,{' '}
                  {diffResult.anomalies.filter(a => a.severity === 'medium').length} medium,{' '}
                  {diffResult.anomalies.filter(a => a.severity === 'low').length} low
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  color="yellow"
                  onClick={() => setAnomalyOnly(!anomalyOnly)}
                >
                  {anomalyOnly ? 'Show All Sections' : 'Show Anomalies Only'}
                </Button>
              </Stack>
            </Alert>
          )}

          {/* Charts */}
          <Grid gutter="md">
            {/* Memory Overview - FLASH vs RAM comparison with Delta */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Paper shadow="sm" p="md" withBorder>
                <Title order={4} mb="md">Memory Overview by Region</Title>
                <Text size="xs" c="dimmed" mb="md">Version 1 vs Version 2 with delta (Δ) values</Text>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={memoryOverviewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis tickFormatter={formatBytes} />
                    <RechartsTooltip
                      formatter={(value: any) => formatBytes(value)}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <Paper p="xs" withBorder shadow="sm">
                              <Stack gap={4}>
                                <Text size="sm" fw={600}>{data.region}</Text>
                                <Text size="xs">Version 1: {formatBytes(data['Version 1'])}</Text>
                                <Text size="xs">Version 2: {formatBytes(data['Version 2'])}</Text>
                                <Text
                                  size="xs"
                                  fw={600}
                                  c={data.delta > 0 ? 'red' : data.delta < 0 ? 'green' : 'gray'}
                                >
                                  Delta: {data.delta > 0 ? '+' : ''}{formatBytes(data.delta)}
                                </Text>
                              </Stack>
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Version 1" fill="#3b82f6" name="Version 1 (Baseline)" />
                    <Bar dataKey="Version 2" fill="#10b981" name="Version 2 (New)" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Delta Summary below chart */}
                <Group justify="space-around" mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                  {memoryOverviewData.map((item) => (
                    <div key={item.region} style={{ textAlign: 'center' }}>
                      <Text size="xs" c="dimmed">{item.region} Δ</Text>
                      <Text
                        size="sm"
                        fw={600}
                        c={item.delta > 0 ? 'red' : item.delta < 0 ? 'green' : 'gray'}
                      >
                        {item.delta > 0 ? '+' : ''}{formatBytes(item.delta)}
                      </Text>
                    </div>
                  ))}
                </Group>
              </Paper>
            </Grid.Col>

            {/* Section-Level Changes */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Paper shadow="sm" p="md" withBorder>
                <Title order={4} mb="md">Section-Level Changes</Title>
                <Text size="xs" c="dimmed" mb="md">Top 15 sections - Version 1 vs Version 2 with delta (Δ)</Text>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={sectionChangesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: 10 }} />
                    <YAxis tickFormatter={formatBytes} />
                    <RechartsTooltip
                      formatter={(value: any) => formatBytes(value)}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <Paper p="xs" withBorder shadow="sm">
                              <Stack gap={4}>
                                <Text size="sm" fw={600}>{data.fullName}</Text>
                                <Text size="xs">Region: <Badge size="xs" color={data.region === 'FLASH' ? 'blue' : 'orange'}>{data.region}</Badge></Text>
                                <Text size="xs">Version 1: {formatBytes(data['Version 1'])}</Text>
                                <Text size="xs">Version 2: {formatBytes(data['Version 2'])}</Text>
                                <Text
                                  size="xs"
                                  fw={600}
                                  c={data.delta > 0 ? 'red' : data.delta < 0 ? 'green' : 'gray'}
                                >
                                  Delta: {data.delta > 0 ? '+' : ''}{formatBytes(data.delta)}
                                </Text>
                              </Stack>
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Version 1" fill="#3b82f6" name="Version 1 (Baseline)" />
                    <Bar dataKey="Version 2" fill="#10b981" name="Version 2 (New)" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Delta Summary below chart - compact layout */}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                  <Grid gutter={4}>
                    {sectionChangesData.map((item) => (
                      <>
                        <Grid.Col key={`${item.fullName}-name`} span={7}>
                          <Text size="xs" c="dimmed" truncate>{item.name}</Text>
                        </Grid.Col>
                        <Grid.Col key={`${item.fullName}-delta`} span={5}>
                          <Group gap={4} wrap="nowrap" justify="flex-end">
                            <Text
                              size="xs"
                              fw={600}
                              c={item.delta > 0 ? 'red' : item.delta < 0 ? 'green' : 'gray'}
                            >
                              {item.delta > 0 ? '↑' : '↓'}
                            </Text>
                            <Text
                              size="xs"
                              fw={600}
                              c={item.delta > 0 ? 'red' : item.delta < 0 ? 'green' : 'gray'}
                              style={{ minWidth: '60px', textAlign: 'right' }}
                            >
                              {item.delta > 0 ? '+' : ''}{formatBytes(item.delta)}
                            </Text>
                          </Group>
                        </Grid.Col>
                      </>
                    ))}
                  </Grid>
                </div>
              </Paper>
            </Grid.Col>

            {/* Top Changes - increases vs decreases */}
            <Grid.Col span={{ base: 12 }}>
              <Paper shadow="sm" p="md" withBorder>
                <Title order={4} mb="md">Top Memory Changes</Title>
                <Text size="xs" c="dimmed" mb="md">Top 10 sections with largest size changes (red = growth, green = reduction)</Text>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topChanges} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatBytes} />
                    <YAxis type="category" dataKey="name" width={120} style={{ fontSize: 11 }} />
                    <RechartsTooltip
                      formatter={(value: any) => formatBytes(value)}
                      labelFormatter={(label) => `Section: ${label}`}
                    />
                    <Bar dataKey="sizeDiff" name="Size Change">
                      {topChanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.type === 'increase' ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Diff Table */}
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Detailed Comparison</Title>
                <Group gap="xs">
                  <Button size="xs" variant="light" leftSection={<IconDownload size={14} />} onClick={exportToCSV}>CSV</Button>
                  <Button size="xs" variant="light" leftSection={<IconDownload size={14} />} onClick={exportToJSON}>JSON</Button>
                </Group>
              </Group>

              {/* Filters */}
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <TextInput
                    placeholder="Search sections..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Filter by status"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={statusFilter}
                    onChange={setStatusFilter}
                    data={[
                      { value: 'added', label: 'Added' },
                      { value: 'removed', label: 'Removed' },
                      { value: 'growth', label: 'Growth' },
                      { value: 'shrink', label: 'Shrink' },
                      { value: 'same', label: 'Unchanged' },
                    ]}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 12, md: 4 }}>
                  <Switch
                    label="Show anomalies only"
                    checked={anomalyOnly}
                    onChange={(e) => setAnomalyOnly(e.currentTarget.checked)}
                  />
                </Grid.Col>
              </Grid>

              <Text size="sm" c="dimmed">
                Showing {filteredDiff.length} of {diffResult.diff.length} sections
              </Text>

              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Section Name</Table.Th>
                      <Table.Th>Region</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>v1 Size</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>v2 Size</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Δ Size</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Δ %</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredDiff.map((entry, idx) => (
                      <Table.Tr key={idx} style={{ backgroundColor: getStatusBgColor(entry.status, 'light') }}>
                        <Table.Td>
                          <Group gap={4}>
                            {getStatusIcon(entry.status)}
                            <Badge size="xs" color={getStatusColor(entry.status)}>
                              {entry.status}
                            </Badge>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>{entry.name}</Text>
                          {entry.filePath && <Text size="xs" c="dimmed">{entry.filePath}</Text>}
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="light" color={entry.region === 'FLASH' ? 'blue' : entry.region === 'RAM' ? 'orange' : 'gray'}>
                            {entry.region}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm">{entry.sizeV1 > 0 ? formatBytes(entry.sizeV1) : '-'}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm">{entry.sizeV2 > 0 ? formatBytes(entry.sizeV2) : '-'}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm" fw={500} c={entry.sizeDiff > 0 ? 'red' : entry.sizeDiff < 0 ? 'green' : 'gray'}>
                            {entry.sizeDiff > 0 ? '+' : ''}{formatBytes(entry.sizeDiff)}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm" c={entry.sizeDiff > 0 ? 'red' : entry.sizeDiff < 0 ? 'green' : 'gray'}>
                            {entry.sizeDiff !== 0 ? `${entry.sizeDiff > 0 ? '+' : ''}${entry.sizeDiffPct.toFixed(1)}%` : '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}
