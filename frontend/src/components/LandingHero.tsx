import { Container, Title, Text, Button, Group, Stack, Paper, Grid, Badge, List, ThemeIcon } from '@mantine/core';
import { IconCheck, IconChartBar, IconGitCompare, IconFileAnalytics, IconDownload, IconZap, IconShieldCheck } from '@tabler/icons-react';

interface LandingHeroProps {
  onGetStarted: () => void;
}

export function LandingHero({ onGetStarted }: LandingHeroProps) {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Hero Section */}
        <section>
          <Stack gap="lg" align="center" style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', paddingTop: '40px' }}>
            <Badge size="lg" variant="light" color="grape">
              Free • Open Source • Privacy-Focused
            </Badge>

            <Title order={1} size="3.5rem" fw={900} c="grape" style={{ lineHeight: 1.2 }}>
              Analyze GCC Linker Map Files
              <br />
              <Text component="span" inherit variant="gradient" gradient={{ from: 'grape', to: 'violet' }}>
                Optimize Your Firmware
              </Text>
            </Title>

            <Text size="xl" c="dimmed" maw={700}>
              The ultimate free tool for embedded systems developers. Visualize memory usage, compare builds, and detect anomalies in your ARM, AVR, ESP32, STM32, and other microcontroller projects.
            </Text>

            <Group gap="md" justify="center" mt="md">
              <Button
                size="xl"
                color="grape"
                variant="filled"
                leftSection={<IconFileAnalytics size={24} />}
                onClick={onGetStarted}
              >
                Analyze Your Map File Now
              </Button>
              <Button
                size="xl"
                variant="light"
                color="grape"
                leftSection={<IconGitCompare size={24} />}
                onClick={onGetStarted}
              >
                Compare Two Builds
              </Button>
            </Group>

            <Text size="sm" c="dimmed">
              ✓ No installation required • ✓ Works offline • ✓ Your data stays private
            </Text>
          </Stack>
        </section>

        {/* Key Features */}
        <section style={{ marginTop: '60px' }}>
          <Title order={2} ta="center" mb="xl">
            Everything You Need for Firmware Memory Analysis
          </Title>

          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper shadow="sm" p="xl" withBorder h="100%">
                <ThemeIcon size={60} radius="md" variant="light" color="blue" mb="md">
                  <IconChartBar size={32} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="sm">
                  Memory Visualization
                </Title>
                <Text c="dimmed">
                  Interactive charts showing Flash and RAM usage. Identify the largest sections and optimize your code efficiently.
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper shadow="sm" p="xl" withBorder h="100%">
                <ThemeIcon size={60} radius="md" variant="light" color="orange" mb="md">
                  <IconGitCompare size={32} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="sm">
                  Build Comparison
                </Title>
                <Text c="dimmed">
                  Compare two map files to track size changes between builds. Catch unexpected growth before it becomes a problem.
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper shadow="sm" p="xl" withBorder h="100%">
                <ThemeIcon size={60} radius="md" variant="light" color="grape" mb="md">
                  <IconZap size={32} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="sm">
                  Anomaly Detection
                </Title>
                <Text c="dimmed">
                  Automatically detect unusual size increases, missing sections, and potential memory issues in your firmware.
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper shadow="sm" p="xl" withBorder h="100%">
                <ThemeIcon size={60} radius="md" variant="light" color="green" mb="md">
                  <IconFileAnalytics size={32} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="sm">
                  Section-Level Analysis
                </Title>
                <Text c="dimmed">
                  Drill down into every section, symbol, and object file. Export detailed reports in CSV, JSON, or PDF format.
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper shadow="sm" p="xl" withBorder h="100%">
                <ThemeIcon size={60} radius="md" variant="light" color="cyan" mb="md">
                  <IconShieldCheck size={32} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="sm">
                  Privacy First
                </Title>
                <Text c="dimmed">
                  All analysis happens in your browser. Your map files never leave your computer. No cloud, no tracking.
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper shadow="sm" p="xl" withBorder h="100%">
                <ThemeIcon size={60} radius="md" variant="light" color="pink" mb="md">
                  <IconDownload size={32} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="sm">
                  Export & Share
                </Title>
                <Text c="dimmed">
                  Generate professional PDF reports, export data as CSV/JSON, and share insights with your team.
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </section>

        {/* Use Cases */}
        <section style={{ marginTop: '60px' }}>
          <Grid gutter="xl" align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={2} mb="md">
                Perfect for Embedded Developers
              </Title>
              <Text size="lg" c="dimmed" mb="lg">
                Whether you're optimizing an IoT device, debugging memory issues, or preparing for production, our tool helps you understand exactly where your firmware's memory goes.
              </Text>
              <List
                spacing="md"
                size="md"
                icon={
                  <ThemeIcon color="grape" size={24} radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  <strong>ARM Cortex-M developers</strong> - Optimize STM32, nRF, SAMD, and other ARM-based microcontrollers
                </List.Item>
                <List.Item>
                  <strong>AVR & Arduino projects</strong> - Analyze ATmega and ATtiny firmware size
                </List.Item>
                <List.Item>
                  <strong>ESP32/ESP8266 developers</strong> - Track partition usage and optimize OTA updates
                </List.Item>
                <List.Item>
                  <strong>RISC-V projects</strong> - Analyze memory for emerging RISC-V platforms
                </List.Item>
                <List.Item>
                  <strong>Automotive & Industrial</strong> - Ensure compliance with strict memory budgets
                </List.Item>
              </List>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper shadow="md" p="xl" withBorder>
                <Title order={3} mb="md" c="grape">
                  How It Works
                </Title>
                <Stack gap="md">
                  <Group>
                    <ThemeIcon size={40} radius="xl" color="grape" variant="light">
                      <Text fw={700}>1</Text>
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>Upload Your Map File</Text>
                      <Text size="sm" c="dimmed">Generate with GCC flag: -Wl,-Map=output.map</Text>
                    </div>
                  </Group>
                  <Group>
                    <ThemeIcon size={40} radius="xl" color="grape" variant="light">
                      <Text fw={700}>2</Text>
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>Instant Analysis</Text>
                      <Text size="sm" c="dimmed">View interactive charts and memory breakdowns</Text>
                    </div>
                  </Group>
                  <Group>
                    <ThemeIcon size={40} radius="xl" color="grape" variant="light">
                      <Text fw={700}>3</Text>
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>Optimize & Export</Text>
                      <Text size="sm" c="dimmed">Identify optimization opportunities and share reports</Text>
                    </div>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </section>

        {/* CTA Section */}
        <section style={{ marginTop: '60px' }}>
          <Paper shadow="lg" p="xl" style={{ background: 'linear-gradient(135deg, #9c27b0 0%, #6a1b9a 100%)', color: 'white', textAlign: 'center' }}>
            <Stack gap="md" align="center">
              <Title order={2} c="white">
                Ready to Optimize Your Firmware?
              </Title>
              <Text size="lg" maw={600} c="white" opacity={0.9}>
                Join thousands of embedded developers using our free tool to build better, leaner firmware.
              </Text>
              <Button
                size="xl"
                variant="white"
                color="grape"
                leftSection={<IconFileAnalytics size={24} />}
                onClick={onGetStarted}
                mt="md"
              >
                Start Analyzing Now - It's Free
              </Button>
            </Stack>
          </Paper>
        </section>
      </Stack>
    </Container>
  );
}
