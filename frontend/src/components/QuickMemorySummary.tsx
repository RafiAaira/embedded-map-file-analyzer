import { Paper, Text, Group, Progress, Stack, Grid } from '@mantine/core';
import type { AnalysisResult } from '../types/index';

interface QuickMemorySummaryProps {
  result: AnalysisResult;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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

export function QuickMemorySummary({ result }: QuickMemorySummaryProps) {
  const summary = calculateMemoryUsage(result);

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Text size="sm" fw={600} mb="md" c="dimmed">Memory Overview</Text>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Flash Memory</Text>
              <Text size="sm" c="grape" fw={600}>
                {formatBytes(summary.usedFlash)} / {formatBytes(summary.totalFlash)}
              </Text>
            </Group>
            <Progress
              value={summary.flashUsagePercent}
              color="grape"
              size="lg"
              radius="xl"
              striped
              animated={summary.flashUsagePercent > 90}
            />
            <Text size="xs" c="dimmed">
              {summary.flashUsagePercent.toFixed(1)}% used
              {summary.flashUsagePercent > 90 && ' ⚠️ High usage'}
            </Text>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>RAM</Text>
              <Text size="sm" c="grape" fw={600}>
                {formatBytes(summary.usedRAM)} / {formatBytes(summary.totalRAM)}
              </Text>
            </Group>
            <Progress
              value={summary.ramUsagePercent}
              color="grape"
              size="lg"
              radius="xl"
              striped
              animated={summary.ramUsagePercent > 90}
            />
            <Text size="xs" c="dimmed">
              {summary.ramUsagePercent.toFixed(1)}% used
              {summary.ramUsagePercent > 90 && ' ⚠️ High usage'}
            </Text>
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
