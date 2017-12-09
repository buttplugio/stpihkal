# Kiiroo Bootloader and Firmware

While it would be a great marketing strategy for the kind of people
that read this document, there is not actually a toy called the Kiiroo
Bootloader. Rather, this refers to the common bootloader that comes
installed on Kiiroo toys, such asthe Fleshlight Launch, Pearl 2, Onyx
2, and others. The bootloader is used to update the on system firmware
over Bluetooth, a sketchy venture in the best of conditions.

###  Command Structure and Flow

Most Kiiroo toys will have 3 characteristics. 

- Bootloader Commands/Control (CTL)
- Data (DATA)
- Sensor (SENSOR)

All bootloader related commands go to CTL.

Commands sent to the boot loader are 2 bytes, sent by setting the
value of CTL with 1 byte, then the value of DATA with 1 byte.

```
0xGG -> CTL
0xHH -> DATA
```

- 0xGG - Byte 0 - command index
- 0xHH - Byte 1 - command data

After this, CTL is read, and the value signifies the success/failure
of the operation.

- 0x02 - Success
- Anything not 0x2 - Failure

If the operation succeeds and expects data back, it will read the DATA
characteristic. Data returns can vary in length. If this is the case, 

###  Commands

#### Get Execution Mode

Retrieves information about the current execution mode of the
hardware.

**Command:**

- Command Index: 0x03
- Command Data: 0x00

**Returns:**

- Byte[1] & 0x0 - Bootloader Mode
- Byte[1] & 0x1 - Application Mode

#### Set Execution Mode

Change the execution mode to Bootloader mode and resets the device.

**Command:**

- Command Index: 0x06
- Command Data: 0x00

**Returns:**

None, device will most likely disconnect after command.

#### Get Software Version

Retrieves information about the version of the firmware currently on
the hardware.

**Command:**

- Command Index: 0x05
- Command Data: 0x00

**Returns:**

If return is 6 bytes:

- Byte[4] - Major Version
- Byte[5] - Minor Version

If return is 12 bytes:

- Byte[10] - Major Version
- Byte[11] - Minor Version

For example, if the firmware version is v1.3, and the return is 6
bytes, we expect it to look like

```
0xXX 0xXX 0xXX 0xXX 0x01 0x03
```

#### Get Flash Information

Retrieves information about the on-chip flash. As toys may have
different chips with differing sizes of flash, return sizes may vary.

**Command:**

- Command Index: 0x0A
- Command Data: 0x00

**Returns:**

If return is 7 bytes:

- High nibble of Byte[0] - Address Increment
- Low nibble of Byte[0] - Word Size
- Byte[1] << 8 || Byte[2] - Program Length
- Byte[3] << 8 || Byte[4] - Program Base
- Byte[5] << 8 || Byte[6] - Row Length

If return is 9 bytes:

- Byte[0] - Flash Erase Value
- High nibble of Byte[1] - Address Increment
- Low nibble of Byte[1] - Word Size
- Byte[2] << 8 || Byte[3] - Program Length
- Byte[4] << 16 || Byte[5] << 8 || Byte[6] - Program Base
- Byte[7] << 8 || Byte[8] - Row Length

#### Erase Memory

Erases the flash of the internal microcontroller.

**Command:**

- Command Index: 0x09
- Command Data: 0x00

**Returns:**

No return value.

#### Verify Memory

Verifies memory. Not sure what this means.

**Command:**

- Command Index: 0x08
- Command Data: 0x00

**Returns:**

No return value.

#### Get CRC

Returns the CRC of the currently loaded firmware.

**Command:**

- Command Index: 0x07
- Command Data: 0x00

**Returns:**

CRC string for the loaded firmware.

#### Push Block

Sends a block of firmware code to the device to be written to flash.

**Command:**

- Command Index: 0x0b
- Command Data: Row data, variable length

**Returns:**

Nothing

#### Write Block

Writes the previously pushed block to flash.

**Command:**

- Command Index: 0x0c
- Command Data: Memory row to write to, as string with leading zeros.

**Returns:**

Nothing
