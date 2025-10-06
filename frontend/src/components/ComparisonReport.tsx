import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, Title, Text, Stack, Group, Badge, Button, Table } from '@mantine/core';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DiffResult } from '../types/index';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

export function ComparisonReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const diffResult = location.state?.diffResult as DiffResult | undefined;

  if (!diffResult) {
    return (
      <Paper p="xl" m="xl">
        <Stack align="center" gap="md">
          <Text>No comparison data available</Text>
          <Button onClick={() => navigate('/?tab=compare')}>Go Back</Button>
        </Stack>
      </Paper>
    );
  }

  // Memory overview data
  const memoryOverviewData = [
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
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Stack gap="md" className="no-print">
        <Group justify="space-between">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/?tab=compare')}
          >
            Back to Analysis
          </Button>
          <Button
            variant="filled"
            color="grape"
            leftSection={<IconPrinter size={16} />}
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </Button>
        </Group>
      </Stack>

      <Paper shadow="sm" p="lg" mt="md">
        <Stack gap="xl">
          {/* Header */}
          <div>
            <Title order={1} c="grape">Build Comparison Report</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Generated on {new Date().toLocaleString()}
            </Text>
          </div>

          {/* Summary */}
          <Group grow>
            <Paper p="md" withBorder style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">Total Size Change</Text>
              <Text
                size="xl"
                fw={700}
                c={diffResult.summary.totalSizeDiff > 0 ? 'red' : diffResult.summary.totalSizeDiff < 0 ? 'green' : 'gray'}
              >
                {diffResult.summary.totalSizeDiff > 0 ? '+' : ''}{formatBytes(diffResult.summary.totalSizeDiff)}
              </Text>
            </Paper>
            <Paper p="md" withBorder style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">Sections Changed</Text>
              <Text size="xl" fw={700} c="grape">
                {diffResult.summary.sectionsGrowth + diffResult.summary.sectionsShrink}
              </Text>
            </Paper>
            <Paper p="md" withBorder style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">Added / Removed</Text>
              <Text size="xl" fw={700}>{diffResult.summary.sectionsAdded} / {diffResult.summary.sectionsRemoved}</Text>
            </Paper>
            <Paper p="md" withBorder style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">Anomalies Detected</Text>
              <Text size="xl" fw={700} c="yellow">{diffResult.anomalies.length}</Text>
              {diffResult.anomalies.length > 0 && (
                <Text size="xs" c="dimmed" mt="xs">
                  {diffResult.anomalies.filter(a => a.severity === 'critical').length} critical,{' '}
                  {diffResult.anomalies.filter(a => a.severity === 'high').length} high
                </Text>
              )}
            </Paper>
          </Group>

          {/* Memory Overview Chart */}
          <div>
            <Title order={3} mb="sm">Memory Overview by Region</Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memoryOverviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis tickFormatter={formatBytes} />
                <RechartsTooltip formatter={(value: any) => formatBytes(value)} />
                <Legend />
                <Bar dataKey="Version 1" fill="#3b82f6" name="Version 1" />
                <Bar dataKey="Version 2" fill="#10b981" name="Version 2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Section-Level Changes */}
          <div>
            <Title order={3} mb="sm">Section-Level Changes</Title>
            <Text size="xs" c="dimmed" mb="sm">Top 15 sections - Version 1 vs Version 2</Text>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={diffResult.diff
                .filter(d => d.sizeDiff !== 0)
                .sort((a, b) => Math.abs(b.sizeDiff) - Math.abs(a.sizeDiff))
                .slice(0, 15)
                .map(d => ({
                  name: d.name.length > 15 ? d.name.substring(0, 13) + '..' : d.name,
                  'Version 1': d.sizeV1,
                  'Version 2': d.sizeV2,
                }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={formatBytes} />
                <RechartsTooltip formatter={(value: any) => formatBytes(value)} />
                <Legend />
                <Bar dataKey="Version 1" fill="#3b82f6" name="Version 1" />
                <Bar dataKey="Version 2" fill="#10b981" name="Version 2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Memory Changes */}
          <div>
            <Title order={3} mb="sm">Top 10 Memory Changes</Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={diffResult.diff
                  .filter(d => d.sizeDiff !== 0)
                  .sort((a, b) => Math.abs(b.sizeDiff) - Math.abs(a.sizeDiff))
                  .slice(0, 10)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatBytes} />
                <YAxis type="category" dataKey="name" width={150} />
                <RechartsTooltip
                  formatter={(value: any) => formatBytes(value)}
                  labelFormatter={(label) => `Section: ${label}`}
                />
                <Bar dataKey="sizeDiff" name="Size Change">
                  {diffResult.diff
                    .filter(d => d.sizeDiff !== 0)
                    .sort((a, b) => Math.abs(b.sizeDiff) - Math.abs(a.sizeDiff))
                    .slice(0, 10)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.sizeDiff > 0 ? '#ef4444' : '#22c55e'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Anomalies Table */}
          {diffResult.anomalies && diffResult.anomalies.length > 0 && (
            <div>
              <Title order={3} mb="sm">Anomalies Detected ({diffResult.anomalies.length})</Title>
              <Text size="sm" c="dimmed" mb="md">Sections with unusual memory changes based on threshold settings</Text>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Severity</Table.Th>
                    <Table.Th>Section Name</Table.Th>
                    <Table.Th>Region</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Δ Size</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Δ %</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {diffResult.anomalies.map((anomaly, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={
                            anomaly.severity === 'critical' ? 'red' :
                            anomaly.severity === 'high' ? 'orange' :
                            anomaly.severity === 'medium' ? 'yellow' : 'gray'
                          }
                        >
                          {anomaly.severity}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{anomaly.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={anomaly.region === 'FLASH' ? 'blue' : 'orange'}>
                          {anomaly.region}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{anomaly.reason}</Text>
                      </Table.Td>
                      <Table.Td
                        style={{
                          textAlign: 'right',
                          color: anomaly.sizeDiff > 0 ? '#ef4444' : '#22c55e',
                          fontWeight: 600,
                        }}
                      >
                        {anomaly.sizeDiff > 0 ? '+' : ''}{formatBytes(anomaly.sizeDiff)}
                      </Table.Td>
                      <Table.Td
                        style={{
                          textAlign: 'right',
                          color: anomaly.sizeDiff > 0 ? '#ef4444' : '#22c55e',
                        }}
                      >
                        {anomaly.sizeDiff !== 0 ? `${anomaly.sizeDiff > 0 ? '+' : ''}${anomaly.sizeDiffPct.toFixed(1)}%` : '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          )}

          {/* Detailed Comparison Table */}
          <div>
            <Title order={3} mb="sm">Detailed Comparison</Title>
            <Text size="sm" c="dimmed" mb="md">Complete breakdown of all section changes</Text>
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
                {diffResult.diff
                  .filter(d => d.sizeDiff !== 0)
                  .sort((a, b) => Math.abs(b.sizeDiff) - Math.abs(a.sizeDiff))
                  .map((item) => (
                    <Table.Tr key={item.name}>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={
                            item.status === 'added' ? 'grape' :
                            item.status === 'removed' ? 'dark' :
                            item.status === 'growth' ? 'red' :
                            item.status === 'shrink' ? 'green' : 'gray'
                          }
                        >
                          {item.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{item.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={item.region === 'FLASH' ? 'blue' : 'orange'}>
                          {item.region}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        {item.sizeV1 > 0 ? formatBytes(item.sizeV1) : '-'}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        {item.sizeV2 > 0 ? formatBytes(item.sizeV2) : '-'}
                      </Table.Td>
                      <Table.Td
                        style={{
                          textAlign: 'right',
                          color: item.sizeDiff > 0 ? '#ef4444' : '#22c55e',
                          fontWeight: 600,
                        }}
                      >
                        {item.sizeDiff > 0 ? '+' : ''}{formatBytes(item.sizeDiff)}
                      </Table.Td>
                      <Table.Td
                        style={{
                          textAlign: 'right',
                          color: item.sizeDiff > 0 ? '#ef4444' : '#22c55e',
                        }}
                      >
                        {item.sizeDiff !== 0 ? `${item.sizeDiff > 0 ? '+' : ''}${item.sizeDiffPct.toFixed(1)}%` : '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </div>
        </Stack>
      </Paper>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .mantine-Paper-root {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
          }
        }
      `}</style>
    </div>
  );
}
