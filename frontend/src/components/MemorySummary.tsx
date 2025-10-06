import { useNavigate } from 'react-router-dom';
import { Paper, Text, Group, Card, RingProgress, Grid, Stack, Button } from '@mantine/core';
import { IconCpu, IconDatabase, IconDownload } from '@tabler/icons-react';
import type { AnalysisResult } from '../types/index';

interface MemorySummaryProps {
  result: AnalysisResult;
  hideExportButton?: boolean;
}

function calculateMemoryUsage(result: AnalysisResult) {
  const flashSections = ['.text', '.rodata', '.data', '.init_array', '.fini_array', '.ARM.exidx', '.ARM.extab', '.preinit_array', '.init', '.fini', '.eh_frame'];
  const ramSections = ['.data', '.bss', '.stack', '.heap'];

  const usedFlash = result.sections
    .filter(s => flashSections.some(fs => s.name.startsWith(fs)))
    .reduce((sum, s) => sum + s.size, 0);

  const usedRAM = result.sections
    .filter(s => ramSections.some(rs => s.name.startsWith(rs)))
    .reduce((sum, s) => sum + s.size, 0);

  const totalFlash = result.memory.FLASH?.lengthBytes || 0;
  const totalRAM = result.memory.RAM?.lengthBytes || 0;

  return {
    totalFlash,
    usedFlash,
    totalRAM,
    usedRAM,
    flashUsagePercent: totalFlash > 0 ? (usedFlash / totalFlash) * 100 : 0,
    ramUsagePercent: totalRAM > 0 ? (usedRAM / totalRAM) * 100 : 0,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function MemorySummary({ result, hideExportButton = false }: MemorySummaryProps) {
  const navigate = useNavigate();
  const summary = calculateMemoryUsage(result);

  const exportToPDF = () => {
    // Navigate to report page with result in state
    navigate('/analysis-report', { state: { result } });
  };

  const exportToPDFOld = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Memory Analysis Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
            font-size: 12px;
          }
          h1 { color: #9b59b6; font-size: 24px; margin-bottom: 10px; }
          h2 { color: #333; font-size: 18px; margin: 20px 0 10px; border-bottom: 2px solid #9b59b6; padding-bottom: 5px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
          .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
          .card-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .card-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
          .card-label { color: #666; }
          .card-value { font-weight: 600; }
          .usage-bar { height: 20px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin: 10px 0; }
          .usage-fill { height: 100%; background: #9b59b6; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
          th { background: #9b59b6; color: white; padding: 8px; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <h1>Memory Analysis Report</h1>
        <p style="color: #666; margin-bottom: 20px;">Generated on ${new Date().toLocaleString()}</p>

        <h2>Memory Summary</h2>
        <div class="summary">
          <div class="card">
            <div class="card-title">FLASH Memory</div>
            <div class="usage-bar">
              <div class="usage-fill" style="width: ${summary.flashUsagePercent}%">${summary.flashUsagePercent.toFixed(1)}%</div>
            </div>
            <div class="card-row">
              <span class="card-label">Used:</span>
              <span class="card-value">${formatBytes(summary.usedFlash)}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Total:</span>
              <span class="card-value">${formatBytes(summary.totalFlash)}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Available:</span>
              <span class="card-value" style="color: #27ae60;">${formatBytes(summary.totalFlash - summary.usedFlash)}</span>
            </div>
          </div>
          <div class="card">
            <div class="card-title">RAM</div>
            <div class="usage-bar">
              <div class="usage-fill" style="width: ${summary.ramUsagePercent}%">${summary.ramUsagePercent.toFixed(1)}%</div>
            </div>
            <div class="card-row">
              <span class="card-label">Used:</span>
              <span class="card-value">${formatBytes(summary.usedRAM)}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Total:</span>
              <span class="card-value">${formatBytes(summary.totalRAM)}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Available:</span>
              <span class="card-value" style="color: #27ae60;">${formatBytes(summary.totalRAM - summary.usedRAM)}</span>
            </div>
          </div>
        </div>

        <h2>All Sections (${result.sections.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Section Name</th>
              <th>File Path</th>
              <th style="text-align: right;">Size</th>
              <th>Address Range</th>
            </tr>
          </thead>
          <tbody>
            ${result.sections
              .sort((a, b) => b.size - a.size)
              .map(s => `
                <tr>
                  <td>${s.name}</td>
                  <td style="font-size: 9px; color: #666;">${s.filePath || '-'}</td>
                  <td style="text-align: right; font-weight: 600;">${formatBytes(s.size)}</td>
                  <td style="font-size: 10px;">${s.address || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>Memory Summary</Text>
        {!hideExportButton && (
          <Button variant="filled" color="grape" leftSection={<IconDownload size={16} />} onClick={exportToPDF}>
            View Full Report (PDF)
          </Button>
        )}
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Stack gap={4}>
                <Group gap="xs">
                  <IconCpu size={20} />
                  <Text fw={600}>Flash Memory</Text>
                </Group>
                <Text size="sm" c="dimmed">Program Storage</Text>
              </Stack>
              <RingProgress
                size={80}
                thickness={8}
                sections={[{ value: summary.flashUsagePercent, color: 'blue' }]}
                label={
                  <Text size="xs" ta="center" fw={700}>
                    {summary.flashUsagePercent.toFixed(1)}%
                  </Text>
                }
              />
            </Group>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Used:</Text>
                <Text size="sm" fw={500}>{formatBytes(summary.usedFlash)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total:</Text>
                <Text size="sm" fw={500}>{formatBytes(summary.totalFlash)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Available:</Text>
                <Text size="sm" fw={500} c="green">
                  {formatBytes(summary.totalFlash - summary.usedFlash)}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Stack gap={4}>
                <Group gap="xs">
                  <IconDatabase size={20} />
                  <Text fw={600}>RAM</Text>
                </Group>
                <Text size="sm" c="dimmed">Runtime Memory</Text>
              </Stack>
              <RingProgress
                size={80}
                thickness={8}
                sections={[{ value: summary.ramUsagePercent, color: 'orange' }]}
                label={
                  <Text size="xs" ta="center" fw={700}>
                    {summary.ramUsagePercent.toFixed(1)}%
                  </Text>
                }
              />
            </Group>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Used:</Text>
                <Text size="sm" fw={500}>{formatBytes(summary.usedRAM)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total:</Text>
                <Text size="sm" fw={500}>{formatBytes(summary.totalRAM)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Available:</Text>
                <Text size="sm" fw={500} c="green">
                  {formatBytes(summary.totalRAM - summary.usedRAM)}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
