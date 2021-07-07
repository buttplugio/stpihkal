# Oriori Ball

The Oriori ball is a grip strength excersiser. It can measure the grip pressure applied to it and it can vibrate. This device can be used as a haptical analog controller.

## Bluetooth LE Connections

### Observed behavior

The following information can be read from Bluetility

Model Number: 0000200001
Serial Number: SN
Firmware Revision: V1.1.3
Software Revision: SW 9600 0dBm

The devices annouces itself as `weixin-nini`. It requires no pairing.
It provides the following services.

|Service|Characteristic|Description
| - | - |- |
|`FFB0`|`FFB1`| Subscribe: ASCII Read Value (see below) |
|`FEE7`|`FEC7`| Write: Likely for the vibrator |


## Protocol

### Read Value
The Read Value is a simple ASCII string of the following shape `AABCCC.C|`
- `AA`: Battery level, likely something between `00` and `99`.
- `B`: `1` if the pressure is increasing since the last measurement, `0` if not
- `C`: The pressure applied in kg(/cm^2?), from `0.0` (if untouched) up to the maximum it can measure (have seen values up to `60.0`).

