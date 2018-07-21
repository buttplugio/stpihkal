# Petrainer Shock Collar

## Introduction

This document describes a way to control the
[Petrainer PET998DRB Dog Training Collar](https://www.amazon.com/gp/product/B00W6UVROK/)  
over 433Mhz-Band Radio Control.
The information was taken from the python2 code attached to this document, which was written by ???

## Communication via RF

The Petrainer listens to OOK on a 434Mhz carrier wave.

The RC-transmitted commands are bitwise encoded as

bit | pwm
--- | ---
0 | 1000
1 | 1110

I haven't tried the code, as one of the libraries seems dead and also I don't have python2 installed.

The provided code talks to an RFCat dongle, but a YardStickOne probably works as a drop-in-replacement.  
I wonder if [this contraption](https://rurandom.org/justintime/w/Cheapest_ever_433_Mhz_transceiver_for_PCs) would work also.

## Commands

Only the Shock function has been documented. The collar also has vibration and beeping capabilities which have not been documented so far.

Command | Description | Parameter
--- | --- | ---
Zap | Issues a static shock of specified strength| 0-100, high is strong

## Protocol

The Zap command looks like

```
01000000 11011101 00101011 10010100 00111111 00
0        8        F         ^^^^^^^
```

where bits no 25:32 (7 bits starting at the 26th) are the zap intensity as a binary number between 0b0000000 and 0b1100100

## Python script

Provide fully commented python3 script here

```python
import rflib
import binascii
import bitstring

MHZ=1000*1000

_COLLAR_BAUD_PWM=4200
_COLLAR_BAUD=_COLLAR_BAUD_PWM/4
_COLLAR_FREQ=434*MHZ

def _pwm_to_raw(pwm):
    raw = bitstring.BitStream()
    while True:
        try:
            nybble = pwm.read(4)
            if nybble.bin == "1110":
                raw += bitstring.Bits("0b1")
            elif nybble.bin == "1000":
                raw += bitstring.Bits("0b0")
            elif nybble.bin == "0000":
                pass #ew
            else:
                print nybble
                print nybble.bin
                raise ValueError("bad nybble")

        except bitstring.ReadError:
            break

    return raw

def _raw_to_pwm(raw):
    pwm = bitstring.BitStream()
    for bit in raw.bin:
        if bit == "0": pwm += bitstring.Bits("0b1000")
        else: pwm += bitstring.Bits("0b1110")

    return pwm


def configure_rfcat(d):
    d.setFreq(_COLLAR_FREQ)
    d.setMdmModulation(rflib.MOD_ASK_OOK)
    d.setMdmDRate(_COLLAR_BAUD_PWM)

def tx_raw(d, raw, repeat=8):
    pwm = _raw_to_pwm(raw)
    tosend = bitstring.BitString(bytes="\x00\x01\xf0", length=(20)) + pwm + bitstring.Bits(bytes="\x00\x00\x00")
    # print tosend.hex
    d.RFxmit(tosend.tobytes(), repeat=repeat)

def zap(d, intensity):
    assert intensity <= 100 
    assert intensity >= 0

    template=bitstring.BitString(bin="010000001101110100101011100101000011111100")
    template[25:32] = bitstring.Bits(uint=intensity, length=7)
    tx_raw(d, template)


class ShockCollar:
    def __init__(self):
        d = rflib.RfCat()
        configure_rfcat(d)
        self.d = d
    def shock(self, intensity=1.0):
        intensity_int = int(intensity*100.0)

        zap(self.d, intensity_int)
```
