# Erostek ET-312B

## Introduction

This document is a specification for the serial communications protocol
of the ET312 Electrostimulation box by Erostek. The following
specifications are for v1.5 and v1.6 of the Erostek firmware, which it
is assumed all modern boxes are running.

## Communication via Link Cable

### Serial Link (PC to ET-312)

Communicating with the ET312 box happens via an RS-232 Connection to the
Link port of the box. The link cable consists of a 3.5mm TRS (stereo
audio) jack, going to some sort of computer connection, be it Female
DB-9 or a RS232-to-USB converter. The pin connections are as follows:

- 3.5mm Tip &lt;-&gt; RX (DB-9 Pin 2)
- 3.5mm Ring &lt;-&gt; TX (DB-9 Pin 3)
- 3.5mm Sleeve &lt;-&gt; Ground (DB-9 Pin 5)

Serial connections are 19200/8/N/1, or:

- 19200 baud
- Data Bits: 8
- Stop Bits: 1
- Partity: None

#### Handshake and Synchronization

Handshaking consists of a byte sent to the box, and a byte received
back:

- 0x00 is sent to ET312
- 0x07 is read from ET312

This is done as a way to establish connection and synchronize the
protocol.

If the box has been previously connected to and not powered off, the
0x00 sent to the ET312 will need to be encrypted with the key
established during the previous session with the box, unless it was
reset (see *Key Resets section*).

Similarly, if a connection is interrupted in the middle of a message,
sending 0x0's until a 0x7 is received is a good way to re-synchronize
the protocol. As the longest message possible with the ET-312 protocol
is 11 bytes, up to 11 0x0s may need to be sent.

#### Key Exchange

After the handshake ends, you can then send "Read Byte" commands without
performing a key exchange. If you wish to "Write Bytes" then XOR keys
must be exchanged. This involves sending a 3 byte sequence to the box,
and receiving 3 bytes back:

- \[0x2f, 0xVV, 0xWW\] sent to ET312
- \[0x21, 0xXX, 0xYY\] is read from ET312

Where:

- 0xVV is a random unsigned 8-bit number, chosen by the host, used as
    the first key. Note that the final key will have the nibbles of this
    value flipped (see [Key
    Usage](id:92c2e9d2-bf6c-4a8e-b732-0eed8cba2406) section).
- 0xXX is a random unsigned 8-bit number, chosen by the ET312, used as
    the second key.
- 0xWW/0xYY is a checksum, the 8-bit unsigned sum of the first two
    bytes, wrapped if the sum is &gt; 255.

For instance:

- \[0x2f, 0x04, 0x33\] is sent to ET312
    - 0x04 is the host XOR key
    - 0x33 is the checksum (0x2f + 0x04)
- \[0x21, 0xef, 0x10\] is read from ET312, meaning
    - 0xef is the box XOR key
    - 0x10 is the checksum ((0x21 + 0xef) % 0x100)

Note that the key chosen by the host need never change, it can simply be
hardcoded into the protocol implementation. Most implementations simply
use 0 for the host key, which simplifies calculation of encryption.

#### Key Usage (Protocol Encryption) {#key-usage-protocol-encryption id="92c2e9d2-bf6c-4a8e-b732-0eed8cba2406"}

Once the keys are agreed upon, all further communication going from host
to ET312 is required to be encoded using the following scheme, using \^
as an XOR operator:

Data Byte \^ (Host Key with nibbles flipped \^ Box Key \^ 0x55)

The part of the expression in parenthesis will be constant after key
exchange, and can be pre-calculated and stored.

The value sent as the host key in the key exchange will need to have the
nibbles flipped when this final key is calculated. For instance, if the
value sent to the ET312 during exchange is 0x12, when calculating the
key, the value used should be 0x21.

Only data sent from host to ET312 requires encryption, all data received
from the ET312 will be cleartext.

### Master and Slave Link (ET-312 to ET-312)

Two ET312 boxes can be linked together using a cross-over cable.

- Box 1 3.5mm Tip &lt;-&gt; Box 2 3.5mm Ring
- Box 1 3.5mm Ring &lt;-&gt; Box 2 3.5mm Tip
- Box 1 3.5mm Sleeve &lt;-&gt; Box 2 3.5mmSleeve

A box becomes Master when you navigate in the menu options to the Link
option. Once linked, a Slave unit A and B channels will follow those
from the Master unit. The A and B pots still control the output levels
for the Slave A and B.

Master-Slave communications are known to be a bit troublesome and can
easily fail.

#### Handshake

Note: There is no encryption (xor bytes) used.

On selecting the menu item, the Master box will send a single byte on
the serial port 0x0e. It expects to see a single byte back from the
Slave 0x05.

After handshake is complete the master box will use the standard
protocol as above to send memory locations to the slave.

The master will first send a 0x9d 0x40 0x04 followed by 6 bytes and a
checksum.

When the slave sends an acknowledgement back (a single 0x06), the master
will send a 0x9d 0x40 0x0a followed by 6 bytes.

When the master gets the next 0x06 back it will send the first 6 bytes
again, forever, as fast as the slave processes them.

Locations \$4004-\$400f contain the processor registers r4-r15

## Commands

Outside of the initial key setup, talking to the ET312 happens through 2
functions. These resemble peek and poke, except that developers can send
between 1-8 bytes at a time. Only 1 byte may be read at a time. Both
functions take 16 bit addresses, which map into a virtual memory space
set up by the communications handler on the ET312. This memory space
looks like:

| Address Range     | Description                       |
| ----------------- | --------------------------------- |
| \$0000 - \$00ff   | Flash (256b from 0x1f00-0x1fff)   |
| \$4000 - \$43ff   | Registers and Partial RAM (1k)    |
| \$8000 - \$81ff   | EEPROM (512b)                     |

Reading past the end of these ranges will just loop the last valid
range.

All further documentation will use these ranges as reference, so when we
mention writing/reading to, say, \$4010, this means we're writing to
byte 16 of the Register/RAM address space.

Also note that we do not have access to all of the RAM via this
protocol. The CPU and IO registers take up the first 96 bytes of the
address space we can access, and do not count as SRAM space. Since the
virtual memory addressing cuts us off at \$43ff, we cannot access the
last 96 bytes of RAM. That said, the stack pointer never seems to move
from 0x045f, which is gcc's RAM end.

### Read Bytes

Reading a byte happens via a command with 3 byte length (plus checksum,
the 8-bit unsigned sum of the first two bytes, wrapped if the sum is
&gt; 255.)

0x3c 0xGG 0xHH 0xCC

- 0xHH - High byte of address
- 0xII - Low byte of address
- 0xCC - Checksum

The box will then respond with two bytes (plus checksum, as above)

0x22 0xVV 0xCC

- 0xVV - Content of requested address
- 0xCC - Checksum

### Write Bytes

Writing a byte happens via a command with 4 byte length (plus checksum)

0xGd 0xHH 0xII \[0xJJ 0xKK...\] 0xCC

- 0xGd - High nibble is amount of data to write to address plus 0x3,
    low nibble is always 0x0d
- 0xHH - High byte of address
- 0xII - Low byte of address
- \[0xJJ 0xKK\]... - Value(s) to set address to
- 0xCC - Checksum

The box will then respond with 0x06 (ACK).

For instance, if we wanted to write 2 bytes, 0xFE 0xFF, starting \$4010,
the command would look like

``` {.example}
0x5d 0x40 0x10 0xfe 0xff 0xaa
```

- 0x5d is the write command with amount (0x3d + 0x20 since we're
    writing 2 bytes)
- 0x40 0x10 is our 16-bit address (\$4010)
- 0xfe 0xff is the data we want to write to \$4010 and
    \$4011, respectively.
- 0xaa is the checksum

## Memory Layout Tables

All entries in **bold** have been mapped and are useful.

### Flash

| Address                                                      | Description |
| ------------------------------------------------------------ | -------------------------- |
| [\$0000 - \$0098](id:b091505a-cb1a-460b-bc0e-786d31c98707)   | **Partial String Table** |
| [\$0098 - \$00fb](id:4064cde9-93ae-4c51-aba9-78dd353402b3)   | .data Segment |
| [\$00fc](id:856a44cb-dee2-47ac-88bb-1587d88f187b)            | **Box Model** |
| [\$00fd - \$00ff](id:2864759c-1eae-4222-90f0-a95206558fe7)   | **Firmware Version** |

### RAM {#ram id="80185aee-05df-4296-b9b2-d0eb888169e8"}

| Address                                             | Description |
| --------------------------------------------------- | --------------------------------------------------------------- |
| \$4000                                              | r0 (CPU Register) |
| \$4001                                              | r1 (CPU Register) |
| \$4002                                              | r2 (CPU Register) |
| \$4003                                              | r3 (CPU Register) |
| \$4004                                              | r4 (CPU Register) |
| \$4005                                              | r5 (CPU Register) copied from \$4090 |
| \$4006                                              | r6 (CPU Register) copied from \$409c |
| \$4007                                              | r7 (CPU Register) copied from \$40a5 |
| \$4008                                              | r8 (CPU Register) copied from min(9, \$40ae) |
| \$4009                                              | r9 (CPU Register) copied from min(50,\$40b7) |
| \$400a                                              | r10 (CPU Register) copied from \$4190 |
| \$400b                                              | r11 (CPU Register) copied from \$419c |
| \$400c                                              | r12 (CPU Register) copied from \$41a5 |
| \$400d                                              | r13 (CPU Register) copied from min(9, \$41ae) |
| \$400e                                              | r14 (CPU Register) copied from min(50, \$41b7) |
| [\$400f](id:469fd503-4cea-4b71-a23c-612f48ee8cb2)   | **r15/ADC disable and other flags - COMM~SYSTEMFLAG~** |
| [\$4010](id:8aaee571-2832-4a3b-be93-425ff03cbf3b)   | **r16 (CPU Register) various flags** |
| [\$4011](id:8317454a-6fa4-416c-b298-55b7dcc41cf9)   | **r17 (CPU Register) various flags** |
| \$4012                                              | r18 (CPU Register) |
| \$4013                                              | **r19 (CPU Register) action when down key pushed** |
| \$4014                                              | **r20 (CPU Register) action when up key pushed** |
| \$4015                                              | **r21 (CPU Register) action when menu key pushed** |
| \$4016                                              | **r22 (CPU Register) action when ok key pushed** |
| \$4017                                              | r23 (CPU Register) |
| \$4018                                              | r24 (CPU Register) |
| \$4019                                              | r25 (CPU Register) |
| \$401a                                              | r26 (CPU Register) |
| \$401b                                              | r27 (CPU Register) |
| \$401c                                              | r28 (CPU Register) |
| \$401d                                              | r29 (CPU Register) |
| \$401e                                              | r30 (CPU Register) |
| \$401f                                              | r31 (CPU Register) |
| \$4020                                              | TWBR (IO Register) |
| \$4021                                              | TWSR (IO Register) |
| \$4022                                            | TWAR (IO Register) |
| \$4023                                            | TWDR (IO Register) |
| \$4024                                            | ADCL (IO Register) |
| \$4025                                            | ADCH (IO Register) |
| \$4026                                            | ADCSRA (IO Register) |
| \$4027                                            | ADMUX (IO Register) |
| \$4028                                            | ACSR (IO Register) |
| [\$4029](id:088e200d-40a6-43f5-a9aa-71f5d477c9d9) | **UBRRL (IO Register, Baud Rate)** |
| \$402a                                            | UCSRB (IO Register) |
| [\$402b](id:bda5abfd-e159-4e0b-867f-46a5eb62d50f) | UCSRA (IO Register) |
| \$402c                                            | UDR (IO Register) |
| \$402d                                            | SPCR (IO Register) |
| \$402e                                            | SPSR (IO Register) |
| \$402f                                            | SPDR (IO Register) |
| \$4030                                            | PIND (IO Register) |
| \$4031                                            | DDRD (IO Register) |
| \$4032                                            | PORTD (IO Register) |
| \$4033                                            | PINC (IO Register) |
| \$4034                                            | DDRC (IO Register) |
| \$4035                                            | PORTC (IO Register) |
| \$4036                                            | PINB (IO Register) |
| \$4037                                            | DDRB (IO Register) |
| \$4038                                            | PORTB (IO Register) |
| \$4039                                            | PINA (IO Register) |
| \$403a                                            | DDRA (IO Register) |
| \$403b                                            | PORTA (IO Register) |
| \$403c                                            | EECR (IO Register) |
| \$403d                                            | EEDR (IO Register) |
| \$403e                                            | EEARL (IO Register) |
| \$403f                                            | EEARH (IO Register) |
| \$4040                                            | UBRRH/UCSRC (IO Register) |
| \$4041                                            | WDTCR (IO Register) |
| \$4042                                            | ASSR (IO Register) |
| \$4043                                            | OCR2 (IO Register) |
| \$4044                                            | TCNT2 (IO Register) |
| \$4045                                            | TCCR2 (IO Register) |
| \$4046                                            | ICR1L (IO Register) |
| \$4047                                            | ICR1H (IO Register) |
| \$4048                                            | OCR1BL (IO Register) |
| \$4049                                            | OCR1BH (IO Register) |
| \$404a                                            | OCR1AL (IO Register) |
| \$404b                                            | OCR1AH (IO Register) |
| \$404c                                            | TCNT1L (IO Register) |
| \$404d                                            | TCNT1H (IO Register) |
| \$404e                                            | TCCR1B (IO Register) |
| \$404f                                            | TCCR1A (IO Register) |
| \$4050                                            | SFIOR (IO Register) |
| \$4051                                            | OSCCAL/OCDR (IO Register) |
| \$4052                                            | TCNT0 (IO Register) |
| \$4053                                            | TCCR0 (IO Register) |
| \$4054                                            | MCUCSR (IO Register) |
| \$4055                                            | MCUCR (IO Register) |
| \$4056                                            | TWCR (IO Register) |
| \$4057                                            | SPMCSR (IO Register) |
| \$4058                                            | TIFR (IO Register) |
| \$4059                                            | TIMSK (IO Register) |
| \$405a                                            | GIFR (IO Register) |
| \$405b                                            | GICR (IO Register) |
| \$405c                                            | OCR0 (IO Register) |
| \$405d                                            | SPL (IO Register) |
| \$405e                                            | SPH (IO Register) |
| \$405f                                            | SREG (IO Register) |
| \$4060                                            | **ADC0: Output Current Sense COMM~MAINCBLOCKBASE~** |
| \$4061                                            | **ADC1: Multi Adjust Offset - CBLOCK~MULTIAOFFSET~** |
| \$4062                                            | **ADC2: Power Supply Voltage** |
| \$4063                                            | **ADC3: Battery Voltage** |
| \$4064                                            | **ADC4: Level Pot A - CBLOCK~POTAOFFSET~** |
| \$4065                                            | **ADC5: Level Pot B - CBLOCK~POTBOFFSET~** |
| \$4066                                            | **ADC6: Audio Input Level A (Half wave)** |
| \$4067                                            | **ADC7: Audio Input Level B (Half wave)** |
| \$4068                                            | Current pushed buttons |
| \$4069                                            | Last pushed buttons |
| \$406A                                            | **Master timer (MSB) (0x4073 LSB) runs 1.91Hz** |
| \$406B                                            | **Channel A calibration (DAC power offset)** |
| \$406C                                            | **Channel B calibration (DAC power offset)** |
| [\$406D](id:dd33adae-a5d8-4595-904f-ae30fef992fb) | **Menu State** |
| \$406E                                            | unused |
| \$406F                                            | unused |
| [\$4070](id:06849b84-e7c5-441c-aa8d-80f86252ce0b) | **Execute Command (1)** |
| [\$4071](id:06849b84-e7c5-441c-aa8d-80f86252ce0b) | **Execute Command (2)** |
| \$4072                                            | Last random number picked |
| \$4073                                            | **Master timer (LSB) runs at 488Hz (8MHz/64(scaler)/256)** |
| \$4074                                            | Random 1 mode, 1 (start) or current random mode number |
| \$4075                                            | Random 1 mode, stores counter time when to change mode |
| \$4076                                            | unused |
| \$4077                                            | unused |
| \$4078                                            | **Current displayed Menu Item/Mode (not yet selected)** |
| \$4079                                            | **Lowest Selectable Menu Item/Mode** |
| \$407A                                            | **Highest Selectable Menu Item/Mode** |
| [\$407b](id:c9640592-450d-4137-9f50-dacf7281e026) | **Current Mode** |
| \$407c                                            | Oscillator Ch A (updated but unused) |
| \$407d                                            | Oscillator Ch A (updated but unused) |
| \$407e                                            | Oscillator Ch B (updated but unused) |
| \$407F                                            | Oscillator Ch B (updated but unused) |
| \$4080                                            | unused (0x00) |
| \$4081                                            | unused (0x00) |
| \$4082                                            | retry counter when communicating with slave (0x02) |
| [\$4083](id:b6012437-88c3-4b3a-a9af-b8f14980620a) | **Output Control Flags - COMM~CONTROLFLAG~** (0x00) |
| \$4084                                            | module to load if condition met |
| \$4085                                            | when module loading determines which channels to set (0x03) |
| \$4086                                            | **Multi Adjust Range Min** (0x0f) |
| \$4087                                            | **Multi Adjust Range Max** (0xff) |
| \$4088                                            | **Module timer (3 bytes) low - 244Hz (409uS)** |
| \$4089                                            | **Module timer (3 bytes) mid - 0.953Hz (1.048S)** |
| \$408a                                            | **Module timer (3 bytes) high - (268.43S)** |
| \$408b                                            | **Module timer (slower) - 30.5Hz** |
| \$408c                                            | Module temporary byte store |
| \$408d                                            | Random Number Min |
| \$408e                                            | Random Number Max |
| \$408f                                            | Module to load if audio triggered |
| \$4090                                            | **Channel A: Current Gate Value** (0x06) |
| \$4091                                            | module wants to change channel A gates |
| \$4092                                            | module wants to change channel B gates |
| \$4093                                            | unused |
| \$4094                                            | **Next module timer current** (0x00) |
| \$4095                                            | **Next module timer max** (0xff) |
| \$4096                                            | **Next module flag** (0x00) |
| \$4097                                            | **Next module number** (0x00) |
| \$4098                                            | **Channel A: Current Gate OnTime** (0x3e) |
| \$4099                                            | **Channel A: Current Gate OffTime** (0x3e) |
| \$409a                                            | **Channel A: Current Gate Select** (0x00) |
| \$409b                                            | **Channel A: number of Gate transitions done** (0x00) |
| \$409c                                            | **Mode Switch Ramp Value Counter** (0x9c) |
| \$409d                                            | **Mode Switch Ramp Value Min** (0x9c) |
| \$409e                                            | **Mode Switch Ramp Value Max** (0xff) |
| \$409f                                            | **Mode Switch Ramp Value Rate** (0x07) |
| \$40a0                                            | **Mode Switch Ramp Value Step** (0x01) |
| [\$40a1](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Mode Switch Ramp Action at Min** (0xfc) |
| [\$40a2](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Mode Switch Ramp Action at Max** (0xfc) |
| \$40a3                                            | **Mode Switch Ramp Select** (0x01) |
| \$40a4                                            | **Mode Switch Ramp Current Timer** (0x00) |
| \$40a5                                            | **Channel A: Current Intensity Modulation Value** (0xff) |
| \$40a6                                            | **Channel A: Current Intensity Modulation Min** (0xcd) |
| \$40a7                                            | **Channel A: Current Intensity Modulation Max** (0xff) |
| \$40a8                                            | **Channel A: Current Intensity Modulation Rate** (0x01) |
| \$40a9                                            | **Channel A: Current Intensity Modulation Step** (0x01) |
| [\$40aa](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel A: Current Intensity Action at Min** (0xff) |
| [\$40ab](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel A: Current Intensity Action at Max** (0xff) |
| \$40ac                                            | **Channel A: Current Intensity Modulation Select** (0x00) |
| \$40ad                                            | **Channel A: Current Intensity Modulation Timer** (0x00) |
| \$40ae                                            | **Channel A: Current Frequency Modulation Value** (0x16) |
| \$40af                                            | **Channel A: Current Frequency Modulation Min** (0x09) |
| \$40b0                                            | **Channel A: Current Frequency Modulation Max** (0x64) |
| \$40b1                                            | **Channel A: Current Frequency Modulation Rate** (0x01) |
| \$40b2                                            | **Channel A: Current Frequency Modulation Step** (0x01) |
| [\$40b3](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel A: Current Frequency Modulation Action Min** (0xff) |
| [\$40b4](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel A: Current Frequency Modulation Action Max** (0xff) |
| \$40b5                                            | **Channel A: Current Frequency Modulation Select** (0x08) |
| \$40b6                                            | **Channel A: Current Frequency Modulation Timer** (0x00) |
| \$40b7                                            | **Channel A: Current Width Modulation Value** (0x82) |
| \$40b8                                            | **Channel A: Current Width Modulation Min** (0x32) |
| \$40b9                                            | **Channel A: Current Width Modulation Max** (0xc8) |
| \$40ba                                            | **Channel A: Current Width Modulation Rate** (0x01) |
| \$40bb                                            | **Channel A: Current Width Modulation Step** (0x01) |
| [\$40bc](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel A: Current Width Modulation Action Min** (0xff) |
| [\$40bd](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel A: Current Width Modulation Action Max** (0xff) |
| \$40be                                            | **Channel A: Current Width Modulation Select** (0x04) |
| \$40bf                                            | **Channel A: Current Width Modulation Timer** (0x00) |
| \$40c0 - \$4177                                   | **Space for User Module Scratchpad A** |
| \$4180                                            | **Write LCD Parameter** |
| \$4181                                            | **Write LCD Position** |
| \$4182                                            | **Parameter r26 for box command** |
| \$4183                                            | **Parameter r27 for box command** |
| \$4184                                            | set to random number during Random 1 Program |
| \$4185 - \$418f                                   | unused |
| \$4190                                            | **Channel B: Current Gate Value** (0 when no output) |
| \$4191 - \$4193                                   | unused |
| \$4194                                            | **Next module timer current** (0x00) |
| \$4195                                            | **Next module timer max** (0xff) |
| \$4196                                            | **Next module flag** (0x00) |
| \$4197                                            | **Next module number** (0x00) |
| \$4198                                            | **Channel B: Current Gate OnTime** (0x3e) |
| \$4199                                            | **Channel B: Current Gate OffTime** (0x3e) |
| \$419a                                            | **Channel B: Current Gate Select** (0x00) |
| \$419b                                            | **Channel B: number of Gate transitions done** (0x00) |
| \$419c                                            | **Mode Switch Ramp Value Counter** (0x9c) |
| \$419d                                            | **Mode Switch Ramp Value Min** (0x9c) |
| \$419e                                            | **Mode Switch Ramp Value Max** (0xff) |
| \$419f                                            | **Mode Switch Ramp Value Rate** (0x07) |
| \$41a0                                            | **Mode Switch Ramp Value Step** (0x01) |
| [\$41a1](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Mode Switch Ramp Action at Min** (0xfc) |
| [\$41a2](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Mode Switch Ramp Action at Max** (0xfc) |
| \$41a3                                            | **Mode Switch Ramp Select** (0x01) |
| \$41a4                                            | **Mode Switch Ramp Current Timer** (0x00) |
| \$41a5                                            | **Channel B: Current Intensity Modulation Value** (0xff) |
| \$41a6                                            | **Channel B: Current Intensity Modulation Min** (0xcd) |
| \$41a7                                            | **Channel B: Current Intensity Modulation Max** (0xff) |
| \$41a8                                            | **Channel B: Current Intensity Modulation Rate** (0x01) |
| \$41a9                                            | **Channel B: Current Intensity Modulation Step** (0x01) |
| [\$41aa](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel B: Current Intensity Action at Min** (0xff) |
| [\$41ab](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel B: Current Intensity Action at Max** (0xff) |
| \$41ac                                            | **Channel B: Current Intensity Modulation Select** (0x00) |
| \$41ad                                            | **Channel B: Current Intensity Modulation Timer** (0x00) |
| \$41ae                                            | **Channel B: Current Frequency Modulation Value** (0x16) |
| \$41af                                            | **Channel B: Current Frequency Modulation Min** (0x09) |
| \$41b0                                            | **Channel B: Current Frequency Modulation Max** (0x64) |
| \$41b1                                            | **Channel B: Current Frequency Modulation Rate** (0x01) |
| \$41b2                                            | **Channel B: Current Frequency Modulation Step** (0x01) |
| [\$41b3](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel B: Current Frequency Modulation Action Min** (0xff) |
| [\$41b4](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel B: Current Frequency Modulation Action Max** (0xff) |
| \$41b5                                            | **Channel B: Current Frequency Modulation Select** (0x08) |
| \$41b6                                            | **Channel B: Current Frequency Modulation Timer** (0x00) |
| \$41b7                                            | **Channel B: Current Width Modulation Value** (0x82) |
| \$41b8                                            | **Channel B: Current Width Modulation Min** (0x32) |
| \$41b9                                            | **Channel B: Current Width Modulation Max** (0xc8) |
| \$41ba                                            | **Channel B: Current Width Modulation Rate** (0x01) |
| \$41bb                                            | **Channel B: Current Width Modulation Step** (0x01) |
| [\$41bc](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel B: Current Width Modulation Action Min** (0xff) |
| [\$41bd](id:90e753ea-ceff-4b85-a7c2-d1bad201809d) | **Channel B: Current Width Modulation Action Max** (0xff) |
| \$41be                                            | **Channel B: Current Width Modulation Select** (0x04) |
| \$41bf                                            | **Channel B: Current Width Modulation Timer** (0x00) |
| \$41c0 - \$41cf                                   | last 16 MA knob readings used for averaging |
| \$41d0 - \$41ef                                   | **User Module Scratchpad Pointers** |
| \$41f0                                            | pointer (counter) for MA knob averaging (0xc0) |
| \$41f1                                            | pointer (counter) for serial output buffer (0x2c) |
| \$41f2                                            | pointer (counter) for serial input buffer (0x20) |
| \$41f3                                            | **CurrentTopMode** (written during routine write) (0x87) |
| [\$41f4](id:72ea60b4-9deb-4808-ac9a-5f0f988c51fe) | **PowerLevel - COMM~POWERLEVEL~ / COMM~LMODE~** (0x02) |
| \$41f5                                            | **Split Mode Number A** (0x77) |
| \$41f6                                            | **Split Mode Number B** (0x76) |
| \$41f7                                            | **Favourite Mode** (0x76) |
| \$41f8                                            | **Advanced Parameter: RampLevel** (0xe1) |
| \$41f9                                            | **Advanced Parameter: RampTime** (0x14) |
| \$41fa                                            | **Advanced Parameter: Depth** (0xd7) |
| \$41fb                                            | **Advanced Parameter: Tempo** (0x01) |
| \$41fc                                            | **Advanced Parameter: Frequency** (0x19) |
| \$41fd                                            | **Advanced Parameter: Effect** (0x05) |
| \$41fe                                            | **Advanced Parameter: Width** (0x82) |
| \$41ff                                            | **Advanced Parameter: Pace** (0x05) |
| \$4200                                            | value of advanced parameter being edited |
| \$4201                                            | min value of advanced parameter being edited |
| \$4202                                            | max value of advanced parameter being edited |
| \$4203                                            | **battery level as a percentage (0-99)** |
| \$4204                                            | calculated pwm frequency |
| \$4205                                            | channel a dac level |
| \$4206                                            | channel b dac level |
| \$4207                                            | **debug mode: displays current module number if not 0** |
| \$4208                                            | used for DAC SPI transfer |
| \$4209                                            | channel a pwm mark |
| \$420a                                            | channel a pwm mark |
| \$420b                                            | channel a pwm space |
| \$420c                                            | channel a pwm space |
| \$420d                                            | **Current Multi Adjust Value / COMM~MULTIAVG~** |
| \$420e                                            | channel b pwm mark |
| \$420f                                            | channel b pwm mark |
| \$4210                                            | channel b pwm space |
| \$4211                                            | channel b pwm space |
| \$4212                                            | com instruction expected instruction length |
| \$4213                                            | **com cipher key** |
| \$4214                                            | com buffer incrementer |
| [\$4215](id:bf60c3a4-3de7-48fd-b5f9-2549181095ff) | **power status bits** |
| \$4216                                            | unused |
| \$4217                                            | unused |
| \$4218 - \$421f                                   | decoded module instruction to parse |
| \$4220 - \$422b                                   | serial comms input buffer |
| \$422c - \$4237                                   | serial comms output buffer |
| \$4238 - \$43FF                                   | unused |

### EEPROM

| Address           | Description |
| ----------------- | -------------------------------------------------------- |
| \$8000            | not used, not set |
| \$8001            | **Magic** (0x55 means we're provisioned) |
| \$8002            | **Box Serial 1** |
| \$8003            | **Box Serial 2** |
| \$8004            | not used, set to 0x00 |
| \$8005            | not used, set to 0x00 |
| \$8006            | **ELinkSig1 - ELINK~SIG1ADDR~** (default 0x01) |
| \$8007            | \*ELinkSig2 - ELINK~SIG2ADDR~ \* (default 0x01) |
| \$8008            | **TopMode NonVolatile (written during routine write)** |
| \$8009            | **Power Level** |
| \$800A            | **Split A Mode Num** |
| \$800B            | **Split B Mode Num** |
| \$800C            | **Favourite Mode** |
| \$800D            | **Advanced Parameter: RampLevel** |
| \$800E            | **Advanced Parameter: RampTime** |
| \$800F            | **Advanced Parameter: Depth** |
| \$8010            | **Advanced Parameter: Tempo** |
| \$8011            | **Advanced Parameter: Frequency** |
| \$8012            | **Advanced Parameter: Effect** |
| \$8013            | **Advanced Parameter: Width** |
| \$8014            | **Advanced Parameter: Pace** |
| \$8015            | not used, set to 0x00 |
| \$8016            | not used, set to 0x00 |
| \$8017            | not used, set to 0x00 |
| \$8018            | **Start Vector User 1 - COMM~USERBASE~** |
| \$8019            | **Start Vector User 2** |
| \$801A            | **Start Vector User 3** |
| \$801B            | **Start Vector User 4** |
| \$801C            | **Start Vector User 5** |
| \$801D            | **Start Vector User 6** |
| \$801E            | **Start Vector User 7 (not implemented)** |
| \$801F            | **Start Vector User 8 (not implemented)** |
| \$8020 - \$803f   | **User routine module pointers 0x80-0x9f** |
| \$8040 - \$80ff   | **Space for User Modules** |
| \$8100 - \$811f   | **User routine module pointers 0xa0-0xbf** |
| \$8120 - \$81ff   | **Space for User Modules** |
                    

## Memory Address Descriptions


### \$0000:\$0097 - String Table {#string-table id="b091505a-cb1a-460b-bc0e-786d31c98707"}


Contains a portion of the string table used for the UI on the ET312 LCD.
Each string is 8 bytes long, padded by spaces (0x20) if needed, with no
null termination.

### \$0098:\$00fb - Data Segment {#fb---data-segment id="4064cde9-93ae-4c51-aba9-78dd353402b3"}

### \$00fc - Box Version {#fc---box-version id="856a44cb-dee2-47ac-88bb-1587d88f187b"}

For the ET312, this will always be 0x0c. (Checked in v1.5 and v1.6
firmware)

### \$00fd:\$00ff - Firmware version {#fd00ff---firmware-version id="2864759c-1eae-4222-90f0-a95206558fe7"}

The Major, Minor, and Interval revision for the firmware on the ET312.
Usually something like

``` {.example}
0x01 0x06 0x00
```

For the v1.6 firmware

### \$400f - Register 15, ADC disable and other flags {#f---register-15-adc-disable-and-other-flags id="469fd503-4cea-4b71-a23c-612f48ee8cb2"}

Byte used for various functions

| Bit   | Description |
| ----- | ------------------------------------------------------------ |
| 0     | Disable ADC (pots etc) (SYSTEM~FLAGPOTSDISABLEMASK~) |
| 1     | If set then we jump to a new module number given in \$4084 |
| 2     | Can this program be shared with a slave unit |
| 3     | Disable Multi Adjust (SYSTEM~FLAGMULTIAPOTDISABLEMASK~) |
| 4-7   | unused |

If bit 0 is set the ADC data is ignored, so effectively disabling the
the front panel potentiometers. You can then send commands to change the
A, B, and MA levels directly. Enabling again sets the unit back to the
actual potentiometer values.

To set the A level write to \$4064 (CurrentLevelA 0-255), to set the B
level write to \$4065 (CurrentLevel B 0-255), to set the MA write to
\$420D (Current Multi Adjust Value, range from min at \$4086 to max at
\$4087).

### \$4010 - Register 16, flags {#register-16-flags id="8aaee571-2832-4a3b-be93-425ff03cbf3b"}

Byte used for various functions

| Bit   | Description |
| ----- | ------------------------------------------------------------ |
| 0     | ?? |
| 1     | ?? |
| 2     | set if we are a linked slave |
| 3     | ?? |
| 4     | ?? |
| 5     | ?? |
| 6     | in slave mode determines which registers to send (toggles) |
| 7     | ?? |

### \$4011 - Register 17, flags {#register-17-flags id="8317454a-6fa4-416c-b298-55b7dcc41cf9"}

Byte used for various functions

| Bit   | Description |
| ----- | ----------------------------------------------------- |
| 0     | when module loading to apply module to channel A |
| 1     | when module loading to apply module to channel B |
| 2     | used to tell main code that the timer has triggered |
| 3     | set while ADC conversion is running |
| 4     | ?? |
| 5     | set if received a full serial command to parse |
| 6     | set if serial comms error |
| 7     | set if we are a linked master |

### \$4029 - UBRRL I/O Register {#ubrrl-io-register id="088e200d-40a6-43f5-a9aa-71f5d477c9d9"}

The low byte of the Serial I/O Register.

By default, this is set to 0x19, with the U2X bit in \$402b (UCSRA) set
to 0, meaning that at the 8mhz clock, the serial port will run at 19200
baud. If this byte is set to 0x0c, the serial port will run at 38400
baud with no noticeable effects on the ET312.

Other non-standard, higher baud rates may be possible, but testing has
not been successful thus far. See <http://wormfood.net/avrbaudcalc.php>
for baud rate calculations, using the 8mhz table.

### \$402b - UCSRA I/O Register {#b---ucsra-io-register id="bda5abfd-e159-4e0b-867f-46a5eb62d50f"}

Contains the U2X bit for doubling serial baud rates. Testing of setting
the U2X bit has usually ended in ET312 communications no longer working
properly (checksum errors).

### \$406D - Menu State {#d---menu-state id="dd33adae-a5d8-4595-904f-ae30fef992fb"}

| Value   | Description |
| ------- | -------------------------------------------- |
| 0x01    | In startup screen or in a menu |
| 0x02    | No menu, program is running and displaying |

### \$4070 and \$4071 - Box Command {#and-4071---box-command id="06849b84-e7c5-441c-aa8d-80f86252ce0b"}

| Value   | Description |
| ------- | ------------------------------------------ |
| 0x00    | Start "Favourite" Routine |
| 0x01    | do nothing |
| 0x02    | Display Status Screen |
| 0x03    | Select current Menu Item |
| 0x04    | Exit Menu |
| 0x05    | Same as 0x00 |
| 0x06    | Set Power Level |
| 0x07    | Edit Advanced Parameter |
| 0x08    | display next menu item |
| 0x09    | display previous menu item |
| 0x0a    | Show Main Menu |
| 0x0b    | Jump to split mode settings menu |
| 0x0c    | Activates Split Mode |
| 0x0d    | Advanced Value Up |
| 0x0e    | Advanced Value Down |
| 0x0f    | Show Advanced Menu |
| 0x10    | Switch to Next mode |
| 0x11    | Switch to Previous mode |
| 0x12    | New Mode |
| 0x13    | Write Character to LCD |
| 0x14    | Write Number to LCD |
| 0x15    | Write String from Stringtable to LCD |
| 0x16    | Load module |
| 0x17    | Not used (error) |
| 0x18    | Clear module (Mute) |
| 0x19    | Swap Channel A and B |
| 0x1a    | Copy Channel A to Channel B |
| 0x1b    | Copy Channel B to Channel A |
| 0x1c    | Copy defaults from EEPROM |
| 0x1d    | Sets up running module registers |
| 0x1e    | Handles single instruction from a module |
| 0x1f    | General way to call these functions |
| 0x20    | Advanced Setting Update |
| 0x21    | Start Ramp |
| 0x22    | Does an ADC conversion |
| 0x23    | Set LCD position |
| 0x24    | (redundant) |
| 0x25    | Not used (error) |
| 0x26    | Not used (error) |
| 0x27    | Not used (error) |
| 0xff    | No command |

Set \$4070 to the value above for the command you want to execute. This
location is checked in the main loop many times a second. If you want to
give more than one command you need to have a short delay after writing
to \$4070 (&gt;\~18mS) to ensure the first command is actioned. If you
want to execute two commands you can write a second command to \$4071
and this location is checked immediately after \$4070 is actioned.

**Note: if a command needs parameters, r26 is read from \$4182 and r27
is read from \$4183**

**Note: Parameters for load module**

Module number is read from \$4182

**Note: Parameters for set power level**

| Level    | \$4078 |
| -------- | -------- |
| low      | 0x6b |
| normal   | 0x6c |
| high     | 0x6d |

**Note: Parameters for the LCD write command**

| Command                  | \$4180                  | \$4181 |
| ------------------------ | ----------------------- | ------------------------------------- |
| Write Character (0x13)   | Character ASCII value   | Display Position (+64 = second row) |
| Write Number (0x14)      | Numerical Value         | Display Position (+64 = second row) |
| Write String (0x15)      | Stringtable Index       | ??? |

### \$407b - Box Modes {#b---box-modes id="c9640592-450d-4137-9f50-dacf7281e026"}

| Value   | Description |
| ------- | --------------------------------- |
| 0x00    | MODE~NUMPOWERON~ |
| 0x01    | MODE~NUMUNKNOWN~ |
| 0x76    | MODE~NUMWAVES~ / MODE~NUMLOWER~ |
| 0x77    | MODE~NUMSTROKE~ |
| 0x78    | MODE~NUMCLIMB~ |
| 0x79    | MODE~NUMCOMBO~ |
| 0x7a    | MODE~NUMINTENSE~ |
| 0x7b    | MODE~NUMRHYTHM~ |
| 0x7c    | MODE~NUMAUDIO1~ |
| 0x7d    | MODE~NUMAUDIO2~ |
| 0x7e    | MODE~NUMAUDIO3~ |
| 0x7f    | MODE~NUMSPLIT~ |
| 0x80    | MODE~NUMRANDOM1~ |
| 0x81    | MODE~NUMRANDOM2~ |
| 0x82    | MODE~NUMTOGGLE~ |
| 0x83    | MODE~NUMORGASM~ |
| 0x84    | MODE~NUMTORMENT~ |
| 0x85    | MODE~NUMPHASE1~ |
| 0x86    | MODE~NUMPHASE2~ |
| 0x87    | MODE~NUMPHASE3~ |
| 0x88    | MODE~NUMUSER1~ |
| 0x89    | MODE~NUMUSER2~ |
| 0x8a    | MODE~NUMUSER3~ |
| 0x8b    | MODE~NUMUSER4~ |
| 0x8c    | MODE~NUMUSER5~ |
| 0x8d    | MODE~NUMUSER6~ |
| 0x8e    | MODE~NUMUSER7~ / MODE~NUMUPPER~ |

**Note: To set mode**

- Write New Mode Number to \$407b
- Write 0x04 to \$4070 (execute "exit menu")
- Write 0x12 to \$4071 (execute "select new mode")
- Wait 18ms (lets box execute previous commands before you change
    mode again)

(Note you can write to two adjacent memory locations in one command so
you can do a write of 0x4 0x12 to \$4070 with the same effect)

### \$4083 - Phase, Front Panel, Mute/Mono/Stereo Control {#phase-front-panel-mutemonostereo-control id="b6012437-88c3-4b3a-a9af-b8f14980620a"}

| Value   | Description |
| ------- | ----------------------------- |
| 0x01    | Phase Control |
| 0x02    | Mute |
| 0x04    | Phase Control 2 |
| 0x08    | Phase Control 3 |
| 0x20    | Disable Frontpanel Switches |
| 0x40    | Mono Mode (off=Stereo) |

**Note: ErosLink uses the following masks:**

- 0x00 - CONTROLFLAG~NORMALMASK~
- 0x04 - CONTROLFLAG~ALLOWOVERLAPMASK~
- 0x05 - CONTROLFLAG~PHASEMASK~
- 0x20 - CONTROLFLAG~DISABLESWITCHESMASK~

### \$4098-\$409b - Current Channel Gate

The output for each channel can be gated (turned on and off continously)
with a variable speed determined by the value of the Gate Select.

Select \$409a:

| Bit 1   | Bit 0   | Description |
| ------- | ------- | ------------------------------------------------ |
| 0       | 0       | No gating |
| 0       | 1       | Use the \$4088 (244Hz) timer for gating |
| 1       | 0       | Use the \$4088 div 8 (30.5Hz) timer for gating |
| 1       | 1       | Use the \$4089 (.953Hz) timer for gating |

If not other bits in Select are set then the on and off time come from
\$4098 (on, default 0x3e) and \$4099 (off, default 0x3e)

| Bit   | Description |
| ----- | ------------------------------------------------------------- |
| 2     | Off time is taken from the advanced parameter tempo default |
| 3     | Off time follows the value of the MA knob |
| 4     | Not used |
| 5     | On time is taken from the advanced parameter effect default |
| 6     | On time follows the value of the MA knob |
| 7     | Not used |

### \$409c-\$40bf - Main Variables

The box output is determined by a group of four variables: Ramp,
Intensity, Frequency, Width. Each variable has several parameters that
determine the current value and how to change that value. Once a module
has set up these parameters, the variables get updated automatically as
configured. The variables may get set to a static value, they may ramp
or or down or loop over time, vary according to the other channel, or
the MA knob.

| Parameter   | Name     | Description |
| ----------- | -------- | ----------------------------------------------------------------- |
| 0           | Value    | The current value of the variable |
| 1           | Min      | Minimum value, if reached an action is performed |
| 2           | Max      | Maximum value, if reached an action is performed |
| 3           | Rate     | Rate of update, based on one of three timers selected by Select |
| 4           | Step     | Used to set direction and speed of update |
| 5           | At Min   | What to do when minimum value is reached |
| 6           | At Max   | What to do when maximum value is reached |
| 7           | Select   | Determines how to update the variable |
| 8           | Timer    | Timer count for rate |

Defaults when a mode starts:

| Variable    | value   | min    | max    | rate   | step   | at min           | at max           | select |
| ----------- | ------- | ------ | ------ | ------ | ------ | ---------------- | ---------------- | ---------------------------------------- |
| Ramp        | 0x9c    | 0x9c   | 0xff   | 0x07   | 0x01   | 0xfc (stop)      | 0xfc (stop)      | 0x01 (use rate parameter, 244Hz timer) |
| Intensity   | 0xff    | 0xcd   | 0xff   | 0x01   | 0x01   | 0xff (reverse)   | 0xff (reverse)   | 0x00 (static) |
| Frequency   | 0x16    | 0x09   | 0x64   | 0x01   | 0x01   | 0xff (reverse)   | 0xff (reverse)   | 0x08 (use MA knob) |
| Width       | 0x82    | 0x32   | 0xc8   | 0x01   | 0x01   | 0xff (reverse)   | 0xff (reverse)   | 0x04 (use advanced parameter default) |

[Examples showing how these are used in
Programs](https://github.com/metafetish/buttshock-et312-firmware/blob/master/doc/programs.org)

#### Select

| Bit 1   | Bit 0   | Description |
| ------- | ------- | ----------------------------------------------------------------- |
| 0       | 0       | Set the value to an absolute value determined by the other bits |
| 0       | 1       | Update the value based on timer at \$4088 (244Hz) |
| 1       | 0       | Update the value based on timer at \$4088 divided by 8 (30.5Hz) |
| 1       | 1       | Update the value based on timer at \$4089 (.953Hz) |

Absolute value when Bit 0 and Bit 1 are both 0:

| Value   | Description |
| ------- | ----------------------------------------------------------------- |
| 0x00    | Leave value alone, nop |
| 0x04    | Set the value to advanced~parameter~ default for this variable |
| 0x08    | Set the value to the current MA knob value |
| 0x0c    | Copy from the other channels value |
| 0x14    | Set the value to the inverse of the advanced~parameter~ default |
| 0x18    | Set the value to the inverse of the current MA knob value |
| 0x1c    | Inverse of the other channels value |

Timer based updates when either Bit 0 or Bit 1 are 1:

| bit 7   | bit 6   | bit 5   | Description |
| ------- | ------- | ------- | ------------------------------------------------ |
| 0       | 0       | 0       | Rate is from parameter (example \$40ba) |
| 0       | 0       | 1       | Rate is from advanced~parameter~ default |
| 0       | 1       | 0       | Rate is from MA value |
| 0       | 1       | 1       | Rate is rate from other channel |
| 1       | 0       | 0       | Rate is inverse of parameter (example \$40ba) |
| 1       | 0       | 1       | Rate is inverse of advanced~parameter~ default |
| 1       | 1       | 0       | Rate is inverse of MA value |
| 1       | 1       | 1       | Rate is inverse of rate from other channel |

Each time we reach the "rate" for the selected timer we add the step
(can be negative) to the current value. We then look to see if we want
to update the "min" value depending on the bits 2-4:

| bit 4   | bit 3   | bit 2   | Description |
| ------- | ------- | ------- | --------------------------------------------------- |
| 0       | 0       | 0       | Don't change min |
| 0       | 0       | 1       | Set min to advanced~parameter~ default |
| 0       | 1       | 0       | Set min to MA value |
| 0       | 1       | 1       | Set min to min of other channel |
| 1       | 0       | 0       | Invert current min value |
| 1       | 0       | 1       | Set min to inverse of advanced~parameter~ default |
| 1       | 1       | 0       | Set min to inverse MA value |
| 1       | 1       | 1       | Set min to inverse of min of other channel |

#### At Min / At Max {#at-min-at-max id="90e753ea-ceff-4b85-a7c2-d1bad201809d"}

This byte specifies what to do when the current value reaches the end of
the range (either the maximum or minimum depending on what variable is
being used).

| Value       | Description |
| ----------- | ---------------------------------------------------------------------- |
| 0x00-0xfb   | Change to new module (value gives module number) |
| 0xfc        | Stop, no longer update this variable |
| 0xfd        | Loop back round (if below min, set to max; if above max, set to min) |
| 0xfe        | Reverse direction, toggle gate, and continue |
| 0xff        | Reverse direction and continue |

### \$41f4 - Power Levels {#f4---power-levels id="72ea60b4-9deb-4808-ac9a-5f0f988c51fe"}

| Value   | Description |
| ------- | ------------- |
| 0x00    | LOW |
| 0x01    | NORMAL |
| 0x02    | HIGH |
| 0x03    | UNKNOWN |

### \$4215 - Power status bits {#power-status-bits id="bf60c3a4-3de7-48fd-b5f9-2549181095ff"}

| Bit   | Description |
| ----- | -------------------------------- |
| 0     | Set if we have a battery |
| 1     | Set if we have a PSU connected |
| 2-7   | unused |

## Common Usages and Tricks

### Key Resets

If you just close the connection to the box then the box won't be able
to handshake again unless you remember the key you got given last time.

However if just before closing the connection to the box you clear out
the current XOR key, future serial connections to the box will appear as
new connections without needing the box to be power cycled.

Do this by sending command below to Write Bytes, setting location \$4213
to 0x00.

### Peeking before Key Exchange

Most client software performs a key handshake. However, if your
application only wants to read bytes there is no need to perform a
handshake and exchange keys.

