fallocate -l 10G /linstor.img



cat <<EOF > /etc/systemd/system/linstor-loop-device.service
[Unit]
Description=Activate Linstor loop device
DefaultDependencies=no
After=systemd-udev-settle.service
Before=lvm2-activation-early.service
Wants=systemd-udev-settle.service

[Service]
ExecStart=/sbin/losetup /dev/loop0 /linstor.img
Type=oneshot

[Install]
WantedBy=local-fs.target
EOF

systemctl daemon-reload && \
    systemctl enable --now linstor-loop-device.service && \
    losetup -l


pvcreate /dev/loop0
vgcreate vg /dev/loop0
lvcreate -l 100%FREE  --thinpool vg/lvmthinpool

lvcreate -V1G -T vg/lvmthinpool -n r0
lvcreate -V1G -T vg/lvmthinpool -n r1
lvcreate -V1G -T vg/lvmthinpool -n r2
lvcreate -V1G -T vg/lvmthinpool -n r3

sleep 3

reboot now


