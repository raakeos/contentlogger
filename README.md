# contentlogger
raakecontentlogger

wget https://raw.githubusercontent.com/raakeos/contentlogger/main/install.sh<br>
sudo chmod 755 ./install.sh<br>
sudo ./install.sh<br>
<br>
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE<br>
sudo netfilter-persistent save<br>
sudo netfilter-persistent reload<br>

