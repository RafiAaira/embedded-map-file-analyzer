import { useState } from 'react';
import { Paper, Text, Stack, Grid, Title, Button, Group, useMantineColorScheme } from '@mantine/core';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IconDownload } from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import type { AnalysisResult } from '../types/index';
import { getSectionColor, PIE_CHART_COLORS } from '../utils/colorMapping';

interface MemoryChartProps {
  result: AnalysisResult;
  selectedSection?: string | null;
  onSectionClick?: (sectionName: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function MemoryChart({ result, selectedSection, onSectionClick }: MemoryChartProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Top 10 sections for bar chart
  const barChartData = result.sections.slice(0, 10).map(section => ({
    name: section.name,
    size: section.size,
    sizeKB: Math.round(section.size / 1024 * 100) / 100,
    filePath: section.filePath,
    color: getSectionColor(section.name),
  }));

  // Memory distribution for pie chart - group small sections as "Other"
  const totalSize = result.sections.reduce((sum, s) => sum + s.size, 0);
  const threshold = totalSize * 0.01; // 1% threshold

  const largeSections = result.sections.filter(s => s.size >= threshold);
  const smallSections = result.sections.filter(s => s.size < threshold);

  const pieChartData = [
    ...largeSections.map(section => ({
      name: section.name,
      value: section.size,
      percentage: parseFloat(((section.size / totalSize) * 100).toFixed(2)),
      filePath: section.filePath,
      color: getSectionColor(section.name),
    })),
    ...(smallSections.length > 0 ? [{
      name: `Other (${smallSections.length} sections)`,
      value: smallSections.reduce((sum, s) => sum + s.size, 0),
      percentage: parseFloat(((smallSections.reduce((sum, s) => sum + s.size, 0) / totalSize) * 100).toFixed(2)),
      filePath: null,
      color: '#95a5a6', // Gray for "Other"
    }] : [])
  ];

  const handleBarClick = (data: any) => {
    if (data && data.name && onSectionClick) {
      onSectionClick(data.name);
    }
  };

  const handlePieClick = (data: any) => {
    if (data && data.name && onSectionClick && !data.name.includes('Other')) {
      onSectionClick(data.name);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper p="sm" shadow="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={600}>{data.name}</Text>
            {data.filePath && (
              <Text size="xs" c="blue">File: {data.filePath}</Text>
            )}
            <Text size="sm">Size: {formatBytes(data.value || data.size)}</Text>
            {data.percentage !== undefined && (
              <Text size="sm" c="grape" fw={500}>{data.percentage}% of total</Text>
            )}
          </Stack>
        </Paper>
      );
    }
    return null;
  };

  const downloadChartAsPNG = async (chartId: string) => {
    const element = document.getElementById(chartId);
    if (!element) {
      console.error('Chart element not found:', chartId);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
        scale: 2, // Higher quality
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `memory-${chartId}-${new Date().toISOString().split('T')[0]}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  };

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" withBorder>
        <Title order={3} mb="md">Memory Visualization</Title>

        <Grid gutter="md">
          {/* Bar Chart */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={600}>Top 10 Sections by Size</Text>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => downloadChartAsPNG('bar-chart')}
                >
                  PNG
                </Button>
              </Group>
              <div id="bar-chart">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barChartData} onClick={handleBarClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#373A40' : '#e0e0e0'} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      fontSize={11}
                      tick={{ fill: isDark ? '#C1C2C5' : '#666' }}
                    />
                    <YAxis
                      label={{ value: 'Size (KB)', angle: -90, position: 'insideLeft', style: { fill: isDark ? '#C1C2C5' : '#666' } }}
                      fontSize={11}
                      tick={{ fill: isDark ? '#C1C2C5' : '#666' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(155, 89, 182, 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: isDark ? '#C1C2C5' : '#000' }} />
                    <Bar
                      dataKey="sizeKB"
                      name="Size (KB)"
                      animationDuration={800}
                      radius={[8, 8, 0, 0]}
                      style={{ cursor: 'pointer' }}
                    >
                      {barChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.name === selectedSection ? '#6c3483' : entry.color}
                          opacity={selectedSection && entry.name !== selectedSection ? 0.5 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Stack>
          </Grid.Col>

          {/* Pie Chart */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={600}>Memory Distribution (sections &gt;1%)</Text>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => downloadChartAsPNG('pie-chart')}
                >
                  PNG
                </Button>
              </Group>
              <div id="pie-chart">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart onClick={handlePieClick}>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={{
                        stroke: isDark ? '#909296' : '#666',
                        strokeWidth: 1,
                      }}
                      label={({ name, percentage }) => `${percentage}%`}
                      outerRadius={120}
                      innerRadius={60}
                      dataKey="value"
                      animationDuration={800}
                      animationBegin={0}
                      paddingAngle={2}
                      onClick={handlePieClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {pieChartData.map((entry, index) => {
                        const isSelected = selectedSection === entry.name;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                            stroke={isSelected ? '#9c27b0' : (isDark ? '#2C2E33' : '#fff')}
                            strokeWidth={isSelected ? 4 : 2}
                            opacity={selectedSection && !isSelected ? 0.5 : 1}
                            style={{ cursor: 'pointer' }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: '11px',
                        paddingLeft: '10px',
                      }}
                      formatter={(value, entry: any) => (
                        <span style={{ color: isDark ? '#C1C2C5' : '#333' }}>
                          {value} ({entry.payload.percentage}%)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  );
}
